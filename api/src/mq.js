const _ = require('lodash')
const config = require('./config')
const amqp = require('amqplib')
const { run, transact } = require('./db')
const EventEmitter = require('events')
const debug = require('debug')('aspect:mq')

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
    this.queues = []
    this.queueEmitActions = null
    this.messageContextIdx = 0
  }

  async connect() {
    if (!this.channel) {
      debug(`connect ${this.name}`)
      const connection = await amqp.connect(config.amqp.url)
      const channel = await connection.createChannel()
      await channel.assertExchange(exchange, 'topic', { durable: true })
      // Do not deliver next message until ack previous per subscriber
      await channel.prefetch(1, false)
      this.channel = channel
    }
    return this
  }

  async purge() {
    if (this.channel) {
      debug(`purge ${this.name}`)
      return Promise.all(
        this.queues.map(queue => this.channel.purgeQueue(queue))
      )
    }
  }

  async close() {
    debug(`close ${this.name}`)
    if (this.channel) {
      await this.purge()
      await this.channel.close()
    }
    this.channel = null
    this.queues = []
    this.queueEmitActions = null
    this.emitter.removeAllListeners()
  }

  /**
   * Dispatch an action created by an action creator
   */
  dispatch(action) {
    if (!_.isString(action.type)) {
      throw new Error('Actions must be object with string type')
    }
    const message = JSON.stringify(action)
    debug(`dispatch ${this.name} ${message}`)
    this.channel.publish(
      exchange,
      `aspect.actions.${action.type}`,
      Buffer.from(message)
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
        const subscribeName = `${queueName}_${name}_${subscriptionIndex}_actions_${type}`
        const topic = `aspect.actions.${type}`
        const { queue } = channel.assertQueue(subscribeName, this.queueOptions)
        this.queues.push(queue)
        channel.bindQueue(queue, exchange, topic)
        channel.consume(queue, message => {
          const content = message.content.toString()
          const messageContext = this.createMessageContext(subscribeName)
          const action = JSON.parse(content)
          debug(`consume ${messageContext.id} ${content}`)
          Promise.resolve(listener(action, { messageContext }))
            .then(() => {
              // Do not ack until listener result resolves
              // Allows backpressure per consumer, if this is not needed can
              // return something (or nothing) that resolves immediately
              debug(`ack ${messageContext.id}`)
              this.channel.ack(message)
            })
            .catch(err => {
              console.error(err) // eslint-disable-line no-console
              // TODO nack/dead letter queue?
              this.channel.ack(message)
            })
        })
      })
    })
  }

  async subscribeEmitActions() {
    if (this.queueEmitActions == null) {
      debug('subscribeEmitActions')
      const { channel } = this
      const { queue } = await channel.assertQueue('', { exclusive: true })
      this.queueEmitActions = queue
      this.queues.push(queue)
      await channel.bindQueue(queue, exchange, 'aspect.actions.*')
      await channel.consume(queue, message => {
        const content = message.content.toString()
        const action = JSON.parse(content)
        this.emitter.emit('action', action)
        this.channel.ack(message)
      })
    }
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
  createMessageContext(id) {
    const contextId = `${id != null ? id : this.name}_${this.messageContextIdx}`
    this.messageContextIdx += 1
    return new MessageContext(this, contextId)
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
  async waitForAction(predicate, timeout = null) {
    await this.subscribeEmitActions()
    return new Promise((resolve, reject) => {
      const check = _.iteratee(predicate)
      const checkedListener = action => {
        if (check(action)) {
          debug(`waitForAction resolve ${JSON.stringify(action)}`)
          dispose()
          resolve(action)
        }
      }

      let timeoutId = null
      if (timeout != null) {
        timeoutId = setTimeout(() => {
          if (timeoutId != null) {
            dispose()
            debug('waitForAction timeout')
            reject(new Error('waitForAction timeout'))
          }
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
  async waitForIdle(idleTime) {
    await this.subscribeEmitActions()
    return new Promise(resolve => {
      let timeIdle = 0
      const clearTimeIdle = () => {
        timeIdle = 0
      }
      const idleTimeIncrement = idleTime / 10
      const idleIntervalId = setInterval(() => {
        timeIdle += idleTimeIncrement
        if (timeIdle >= idleTime) {
          debug('waitForIdle resolve')
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
  constructor(queue, id) {
    this.queue = queue
    this.id = id
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
      debug(`dispatch delay ${this.id} ${JSON.stringify(action)}`)
      this.actions.push(action)
    } else {
      // transaction complete, dispatch to MQ
      debug(`dispatch ${this.id} ${JSON.stringify(action)}`)
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

  run(task) {
    return run(async knex => task(knex))
  }

  commit() {
    if (this.isFinalState) {
      throw new Error('Cannot commit after final state, create new context')
    }
    debug(`commit ${this.id}`)
    this.transaction = null
    this.actions.forEach(action => this.dispatch(action))
    this.isFinalState = true
  }

  rollback() {
    debug(`rollback ${this.id}`)
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
