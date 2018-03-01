const _ = require('lodash')
const mqtt = require('mqtt')
const EventEmitter = require('events')
const { transact } = require('./db')

// ----------- Message Types ---------------------
const types = {
  RESULT_UPDATED: 'RESULT_UPDATED',
  RESULT_LOGGED: 'RESULT_LOGGED',
}

// ------------- Setup ---------------------------

const client = mqtt.connect('mqtt://localhost:1883')
const emitter = new EventEmitter()
client.on('connect', () => {
  console.log('Connected')
  _.each(types, type => {
    client.subscribe(`aspect/messages/${type}`)
  })
})

client.on('message', (topic, message) => {
  console.log(`Message on ${topic}`)
  const match = /^aspect\/messages\/([^/]+)$/.exec(topic)
  if (match) {
    const action = JSON.parse(message.toString())
    if (action.type === match[1]) {
      emitter.emit(action.type, action)
    }
  }
})

// ----------- Dispatch and  Listeners -----------

/**
 * Dispatch an action created by an action creator
 */
function dispatch(action) {
  client.publish(`aspect/messages/${action.type}`, JSON.stringify(action))
}

/**
 * Adds a listener for the specified message type.
 * Will be invoked with action created by action
 * creators and dispatched using dispatch
 */
function addListener(type, listener) {
  emitter.addListener(type, listener)
}

/**
 * Removes a listener added by addListener
 */
function removeListener(type, listener) {
  emitter.removeListener(type, listener)
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
        await Promise.all(
          _.map(_.range(context.tasks.length), async () => {
            const task = context.tasks.shift()
            await task(knex)
          })
        )
      })
        .then(context.commit)
        .then(null, err => {
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
 * The resultId is required.
 *
 * The message can be specified, indicating the change made
 * and is recommended, but is optional.
 *
 * The source is also optional, defaults to 'ClientAPI'
 */
function notifyResultUpdated(resultId, message, source = 'ClientAPI') {
  if (resultId == null) {
    throw new Error('Must specify resultId for notifyResultUpdated')
  }
  return {
    type: types.RESULT_UPDATED,
    resultId,
    message,
    source,
  }
}

/**
 * Creates an action to notify the result with given id
 * has been logged in the DeviceLog.
 *
 * The resultId is required and deviceLogId are required.
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
  addListener,
  removeListener,
  notifyResultUpdated,
  notifyResultLogged,
}
