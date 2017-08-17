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
 * Dispatch an action created by an action creator
 */
function dispatch(action) {
  // emit is synchronous, use setImmediate so we can
  // clear call stack and we don't rely on synchronous execution
  setImmediate(() => emitter.emit(action.type, action))
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
 * The resultId is required.
 */
function notifyResultLogged(resultId) {
  if (resultId == null) {
    throw new Error('Must specify resultId for notifyResultLogged')
  }
  return {
    type: types.RESULT_LOGGED,
    resultId,
  }
}

module.exports = {
  types,
  dispatch,
  addListener,
  removeListener,
  notifyResultUpdated,
  notifyResultLogged,
}
