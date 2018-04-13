const _ = require('lodash')
const config = require('./config')
const amqp = require('amqplib')
const { transact } = require('./db')
const EventEmitter = require('events')

const exchange = 'aspect'

async function createMessageQueue(name) {
  if (name == null) {
    throw new Error('Must specify unique queue name')
  }
  return new MessageQueue(name).connect()
}

class MessageQueue {
  constructor(name) {
    this.name = name
    this.emitter = new EventEmitter()
  }

  async connect() {
    await this.close()
    const connection = await amqp.connect(config.amqp.url)
    const channel = await connection.createChannel()
    await channel.assertExchange(exchange, 'topic', { durable: true })
    this.channel = channel

    const { queue } = channel.assertQueue(`${this.name}_actions_all`)
    channel.bindQueue(queue, exchange, 'aspect.actions.*')
    channel.consume(queue, message => {
      const action = JSON.parse(message.content.toString())
      this.emitter.emit('action', action)
      this.channel.ack(message)
    })
    return this
  }

  async close() {
    if (this.channel) {
      await this.channel.close()
    }
    this.channel = null
    this.emitter.removeAllListeners()
  }

  /**
   * Dispatch an action created by an action creator
   */
  dispatch(action) {
    if (!_.isString(action.type)) {
      throw new Error('Actions must be object with string type')
    }
    this.channel.publish(
      exchange,
      `aspect.actions.${action.type}`,
      Buffer.from(JSON.stringify(action))
    )
  }

  /**
   * Subscribes to messages with the named service.
   *
   * Accepts array of subscriptions, each with the following
   * properties:
   *
   * actions: map Action Type name to listener function that
   *   accepts incoming actions of that type.
   *
   *   The listener will be called with the action and
   *   new message context created from this queue.
   *
   *   Can specify multiple action types per subscription.
   */
  subscribe(name, subscriptions) {
    _.each(subscriptions, ({ actions }, subscriptionIndex) => {
      _.each(actions, (listener, type) => {
        const { channel, name: queueName } = this
        const { queue } = channel.assertQueue(
          `${queueName}_${name}_${subscriptionIndex}_actions_${type}`
        )
        channel.bindQueue(queue, exchange, `aspect.actions.${type}`)
        channel.consume(queue, message => {
          const action = JSON.parse(message.content.toString())
          try {
            listener(action, {
              messageContext: this.createMessageContext(),
            })
          } catch (err) {
            console.error(err) // eslint-disable-line no-console
          }
          this.channel.ack(message)
        })
      })
    })
  }

  /**
   * Creates a message context to allow transactional
   * updates and dispatch.
   *
   * You should normally deal with a provided context
   * pre-created on request/response cycle.
   *
   * actionCreators: if specified, context will have
   * bound actions with same name as action creators
   */
  createMessageContext() {
    return new MessageContext(this)
  }

  /**
   * Creates a listener that waits for an action
   * passing the given predicate and returns a
   * Promise that resolves with the action.
   *
   * predicate: rules for predicate follow the
   * same rules * as lodash (see _.iteratee)
   * timeout: if specified, promise will be
   * rejected if action does not occur before
   * timeout in millis.
   *
   * NOTE: It is generally preferred to avoid
   * relying on this function and create additional
   * action creators. This is mainly exposed for
   * testing.
   */
  waitForAction(predicate, timeout = null) {
    return new Promise((resolve, reject) => {
      const check = _.iteratee(predicate)
      const checkedListener = action => {
        if (check(action)) {
          dispose()
          resolve(action)
        }
      }

      let timeoutId = null
      if (timeout != null) {
        timeoutId = setTimeout(() => {
          dispose()
          reject(new Error('waitForAction timeout'))
        }, timeout)
      }

      const dispose = () => {
        if (timeoutId != null) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        this.emitter.removeListener('action', checkedListener)
      }
      this.emitter.addListener('action', checkedListener)
    })
  }

  /**
   * Creates a listener that waits for the queue
   * to be idle for a certain time and returns
   * a promise that resolves when idle time has passed.
   *
   * idleTime: time in millis to determine queue is idle
   *
   * NOTE: It is generally preferred to avoid
   * relying on this function and create additional
   * action creators. This is mainly exposed for
   * testing.
   */
  waitForIdle(idleTime) {
    return new Promise(resolve => {
      let timeIdle = 0
      const clearTimeIdle = () => {
        timeIdle = 0
      }
      const idleTimeIncrement = idleTime / 10
      const idleIntervalId = setInterval(() => {
        timeIdle += idleTimeIncrement
        if (timeIdle >= idleTime) {
          clearInterval(idleIntervalId)
          this.emitter.removeListener('action', clearTimeIdle)
          resolve()
        }
      }, idleTimeIncrement)
      this.emitter.addListener('action', clearTimeIdle)
    })
  }
}

class MessageContext {
  constructor(queue) {
    this.queue = queue
    _.bindAll(this, ['dispatch', 'transact', 'rollback', 'commit'])
    this.transaction = null
    this.actions = []
    this.isFinalState = false
  }

  dispatch(action) {
    if (this.isFinalState) {
      throw new Error('Cannot dispatch after final state, create new context')
    }

    if (this.transaction) {
      // Queue actions until transaction committed
      this.actions.push(action)
    } else {
      // transaction complete, dispatch to MQ
      this.queue.dispatch(action)
    }
  }

  transact(task) {
    if (this.transaction) {
      throw new Error('Cannot create multiple transactions, create new context')
    }
    this.transaction = transact(async knex => task(knex))
      .then(this.commit)
      .then(null, err => {
        console.error(err) // eslint-disable-line no-console
        this.rollback()
        throw err
      })
    return this.transaction
  }

  commit() {
    if (this.isFinalState) {
      throw new Error('Cannot commit after final state, create new context')
    }
    this.transaction = null
    this.actions.forEach(action => this.dispatch(action))
    this.isFinalState = true
  }

  rollback() {
    if (this.isFinalState) {
      throw new Error('Cannot rollback after final state, create new context')
    }
    this.transaction = null
    this.isFinalState = true
  }

  bindActionCreators(creators) {
    _.each(creators, (creator, name) => {
      this[name] = (...args) => this.dispatch(creator(...args))
      this[name].bind(this)
    })
    return this
  }
}

module.exports = { createMessageQueue }
