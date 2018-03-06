const _ = require('lodash')
const config = require('./config')
const mqtt = require('mqtt')
const { transact } = require('./db')

function createMessageQueue(name) {
  if (name == null) {
    throw new Error('Must specify unique queue name')
  }
  return new MessageQueue(name)
}

class MessageQueue {
  constructor(name) {
    this.name = name
    this.clients = []
    _.bindAll(this, [
      'dispatch',
      'publish',
      'subscribe',
      'subscribeAll',
      'createMessageContext',
    ])
  }

  close() {
    return Promise.all(
      _.map(
        this.clients,
        client => new Promise(resolve => client.end(resolve))
      ).then(() => {
        this.publishClient = null
        this.clients = []
      })
    )
  }

  /**
   * Dispatch an action created by an action creator
   */
  dispatch(action) {
    if (!_.isString(action.type)) {
      throw new Error('Actions must be object with string type')
    }
    this.publish(`aspect/actions/${action.type}`, JSON.stringify(action), {
      durable: true,
    })
  }

  publish(topic, message, { durable = false }) {
    if (this.publishClient == null) {
      this.publishClient = mqtt.connect(config.mqtt.url, {
        clientId: `${this.name}-publish`,
      })
      this.clients.push(this.publishClient)
    }
    const qos = durable ? 1 : 0
    this.publishClient.publish(topic, message, { qos })
  }

  /**
   * Subscribes to messages with the named service.
   *
   * name: required. Unique service identifier
   *
   * durable (optional, default false):
   *
   *   false for at most once delivery, messages may be lost (though rare)
   *   but will not be duplicated and will not be queued on disconnect
   *
   *   true for at least once delivery guarantee, messages will be
   *   queued on disconnect and best effort to deliver at least once.
   *   messages may be duplicated (though rare)
   *
   * actions: map Action Type name to listener function that
   *   accepts incoming actions of that type. Can specify multiple
   *   action types per subscription.
   */
  subscribe({ name, durable = false, actions = {} }) {
    const clean = false
    const qos = durable ? 1 : 0
    const client = mqtt.connect(config.mqtt.url, {
      clientId: `${this.name}-${name}`,
      clean,
    })
    this.clients.push(client)
    client.on('connect', () => {
      const topics = _.map(
        actions,
        (listener, type) => `aspect/actions/${type}`
      )
      client.subscribe(topics, { qos })
    })

    client.on('message', (topic, message) => {
      const actionMatch = /^aspect\/actions\/([^/]+)$/.exec(topic)
      if (actionMatch != null) {
        const action = JSON.parse(message.toString())
        const listener = actions[action.type]
        const matchType = actionMatch[1]
        if (listener != null && action.type === matchType) {
          listener(action, { messageContext: this.createMessageContext() })
        }
      }
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
