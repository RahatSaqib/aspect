const _ = require('lodash')
const config = require('./config')
const mqtt = require('mqtt')
const { transact } = require('./db')

let defaultQueue = null
function loadDefaultQueue() {
  if (defaultQueue == null) {
    defaultQueue = createMessageQueue('messages')
  }
  return defaultQueue
}

function createMessageQueue(name) {
  const publishClient = mqtt.connect(config.mqtt.url, {
    clientId: `aspect-${name}`,
  })
  return new MessageQueue(publishClient)
}

function createMessageContext(actionCreators = null) {
  return loadDefaultQueue().createMessageContext(actionCreators)
}

class MessageQueue {
  constructor(publishClient) {
    this.publishClient = publishClient
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
    const clean = !durable
    const qos = durable ? 1 : 0
    const client = mqtt.connect(config.mqtt.url, {
      clientId: `aspect-${name}`,
      clean,
    })
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
        if (listener != null && action.type === actionMatch[1]) {
          listener(action)
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
  createMessageContext(actionCreators = null) {
    return new MessageContext(this, actionCreators)
  }
}

class MessageContext {
  constructor(queue, actionCreators) {
    this.queue = queue
    _.bindAll(this, ['dispatch', 'transact', 'rollback', 'commit'])
    if (actionCreators != null) {
      Object.assign(this, bindActionCreators(actionCreators, this.dispatch))
      _.bindAll(this, Object.keys(actionCreators))
    }
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
}

function bindActionCreators(creators, dispatch = dispatch) {
  return _.mapValues(creators, creator => bindActionCreator(creator, dispatch))
}

function bindActionCreator(actionCreator, dispatch) {
  return function invokeAction(...args) {
    const action = actionCreator(...args)
    dispatch(action)
  }
}

module.exports = {
  loadDefaultQueue,
  createMessageContext,
}
