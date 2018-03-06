const _ = require('lodash')
const config = require('./config')
const mqtt = require('mqtt')
const { transact } = require('./db')
const EventEmitter = require('events')

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
    _.bindAll(this, [
      'dispatch',
      'subscribe',
      'subscribeAll',
      'createMessageContext',
    ])
  }

  async connect() {
    await this.close()
    await new Promise((resolve, reject) => {
      const client = mqtt.connect(config.mqtt.url, {
        clientId: this.name,
        clean: false,
      })

      this.client = client
      client.on('message', (topic, message) => {
        const actionMatch = /^aspect\/actions\/([^/]+)$/.exec(topic)
        if (actionMatch != null) {
          const action = JSON.parse(message.toString())
          const matchType = actionMatch[1]
          if (action.type === matchType) {
            this.emitter.emit(action.type, action, {
              messageContext: this.createMessageContext(),
            })
          }
        }
      })

      client.on('connect', () => {
        client.subscribe('aspect/actions/+', { qos: 1 }, err => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    })
    return this
  }

  async close() {
    if (this.client) {
      await new Promise(resolve => this.client.end(resolve))
    }
    this.client = null
    this.emitter.removeAllListeners()
  }

  /**
   * Dispatch an action created by an action creator
   */
  dispatch(action) {
    if (!_.isString(action.type)) {
      throw new Error('Actions must be object with string type')
    }
    this.client.publish(
      `aspect/actions/${action.type}`,
      JSON.stringify(action),
      { qos: 1 }
    )
  }

  /**
   * Subscribes to messages with the named service.
   *
   * actions: map Action Type name to listener function that
   *   accepts incoming actions of that type. Can specify multiple
   *   action types per subscription.
   */
  subscribe({ actions = {} }) {
    _.each(actions, (listener, type) => {
      this.emitter.addListener(type, listener)
    })
  }

  /**
   * Subscribes to multiple subscriptions defined as an array
   */
  subscribeAll(subscriptions) {
    return subscriptions.map(subscription => this.subscribe(subscription))
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
}

class MessageContext {
  constructor(queue) {
    this.queue = queue
    _.bindAll(this, ['dispatch', 'transact', 'rollback', 'commit'])
    this.reset()
  }

  dispatch(action) {
    if (_.isFunction(action)) {
      // Allow thunks
      action = action(this.dispatch)
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
    this.tasks.push(task)
    if (!this.transaction) {
      const context = this
      context.transaction = transact(async knex => {
        // This needs to be in loop and synchronous
        // because task may add to stack. Do not change
        // to Promise.all or map over assumed range
        /* eslint-disable no-await-in-loop */
        while (context.tasks.length > 0) {
          task = context.tasks.shift()
          await task(knex)
        }
      })
        .then(context.commit)
        .then(null, err => {
          console.error(err) // eslint-disable-line no-console
          context.rollback()
          throw err
        })
    }
    return this.transaction
  }

  commit() {
    const { actions } = this
    this.reset()
    actions.forEach(action => this.dispatch(action))
  }

  rollback() {
    this.reset()
  }

  reset() {
    this.transaction = null
    this.actions = []
    this.tasks = []
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
