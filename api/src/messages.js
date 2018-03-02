const _ = require('lodash')
const config = require('./config')
const mqtt = require('mqtt')
const { transact } = require('./db')

// ----------- Message Types ---------------------
const types = {
  RESULT_UPDATED: 'RESULT_UPDATED',
  RESULT_LOGGED: 'RESULT_LOGGED',
}

// ------------- Setup ---------------------------

// ----------- Dispatch and  Listeners -----------
const messageClient = mqtt.connect(config.mqtt.url, {
  clientId: 'aspect-messages',
})

/**
 * Dispatch an action created by an action creator
 */
function dispatch(action) {
  messageClient.publish(
    `aspect/messages/${action.type}`,
    JSON.stringify(action),
    { qos: 1 }
  )
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
 * listeners: map Message Type name to listener function that
 *   accepts incoming messages of that type. Can specify multiple
 *   message types per subscription.
 */
function subscribe({ name, durable = false }, listeners) {
  const clean = !durable
  const qos = durable ? 1 : 0
  const client = mqtt.connect(config.mqtt.url, {
    clientId: `aspect-${name}`,
    clean,
  })
  client.on('connect', () => {
    const topics = _.map(listeners, (listener, type) => {
      if (types[type] == null) {
        throw new Error(`Unknown message type ${type}`)
      }
      return `aspect/messages/${type}`
    })
    client.subscribe(topics, { qos })
  })

  client.on('message', (topic, message) => {
    const action = JSON.parse(message.toString())
    const listener = listeners[action.type]
    if (listener != null) {
      listener(action)
    }
  })
}

/**
 * Creates a message context to allow transactional
 * updates and dispatch.
 *
 * You should normally deal with a provided context
 * pre-created on request/response cycle.
 */
function createMessageContext() {
  return new MessageContext()
}

class MessageContext {
  constructor() {
    this.dispatch = this.dispatch.bind(this)
    this.transact = this.transact.bind(this)
    this.rollback = this.rollback.bind(this)
    this.commit = this.commit.bind(this)

    this.reset()
  }

  dispatch(action) {
    if (this.transaction) {
      this.actions.push(action)
    } else {
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

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the result with given id
 * has been updated.
 *
 * resultId is required.
 * deviceLogId is optional, specified if update is already
 * associated with a device log entry (NOTE if not specified,
 * device API listener will create one)
 *
 * The source is also optional, defaults to 'ClientAPI'
 */
function notifyResultUpdated(resultId, deviceLogId) {
  if (resultId == null) {
    throw new Error('Must specify resultId for notifyResultUpdated')
  }
  return {
    type: types.RESULT_UPDATED,
    resultId,
    deviceLogId,
  }
}

/**
 * Creates an action to notify the result with given id
 * has been logged in the DeviceLog.
 *
 * resultId is required
 * deviceLogId is required
 */
function notifyResultLogged(resultId, deviceLogId) {
  if (resultId == null || deviceLogId == null) {
    throw new Error(
      'Must specify resultId and deviceLogId for notifyResultLogged'
    )
  }
  return {
    type: types.RESULT_LOGGED,
    resultId,
    deviceLogId,
  }
}

module.exports = {
  types,
  createMessageContext,
  dispatch,
  subscribe,
  notifyResultUpdated,
  notifyResultLogged,
}
