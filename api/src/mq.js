const _ = require('lodash')
const config = require('./config')
const mqtt = require('mqtt')
const { transact } = require('./db')

// ----------- Publish and  Subscribe -----------
const messageClient = mqtt.connect(config.mqtt.url, {
  clientId: 'aspect-messages',
})

/**
 * Dispatch an action created by an action creator
 */
function dispatch(action) {
  if (!_.isString(action.type)) {
    throw new Error('Actions must be object with string type')
  }
  publish(`aspect/actions/${action.type}`, JSON.stringify(action), {
    durable: true,
  })
}

function publish(topic, message, { durable = false }) {
  const qos = durable ? 1 : 0
  messageClient.publish(topic, message, { qos })
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
function subscribe({ name, durable = false, actions = {} }) {
  const clean = !durable
  const qos = durable ? 1 : 0
  const client = mqtt.connect(config.mqtt.url, {
    clientId: `aspect-${name}`,
    clean,
  })
  client.on('connect', () => {
    const topics = _.map(actions, (listener, type) => `aspect/actions/${type}`)
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
 * Creates a message context to allow transactional
 * updates and dispatch.
 *
 * You should normally deal with a provided context
 * pre-created on request/response cycle.
 *
 * actionCreators: if specified, context will have
 * bound actions with same name as action creators
 */
function createMessageContext(actionCreators = null) {
  return new MessageContext(actionCreators)
}

class MessageContext {
  constructor(actionCreators) {
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
      dispatch(action)
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
  subscribe,
  createMessageContext,
}
