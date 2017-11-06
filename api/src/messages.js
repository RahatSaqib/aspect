// TODO switch to Message Queue? Make more Redux Like?
const EventEmitter = require('events')

const emitter = new EventEmitter()

// ----------- Message Types ---------------------
const types = {
  RESULT_UPDATED: 'RESULT_UPDATED',
  RESULT_LOGGED: 'RESULT_LOGGED',
}

// ----------- Dispatch and  Listeners -----------

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
 * Cretes a message context to allow transactional
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
    this.actions = []
  }

  dispatch(action) {
    this.actions.push(action)
  }

  commit() {
    console.log('COMMIT')
    console.log({ actions: this.actions })
    this.actions.forEach(action => dispatch(action))
  }
}

/**
 * Dispatch an action created by an action creator
 */
function dispatch(action) {
  // emit is synchronous, use setImmediate so we can
  // clear call stack and we don't rely on synchronous execution
  setImmediate(() => emitter.emit(action.type, action))
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
