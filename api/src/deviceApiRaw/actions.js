// ----------- Action Types ---------------------
const types = {
  DEVICE_RAW_MESSAGE_POSTED: 'DEVICE_RAW_MESSAGE_POSTED',
  DEVICE_RAW_MESSAGE_RESPONSE_READY: 'DEVICE_RAW_MESSAGE_RESPONSE_READY',
  DEVICE_RAW_MESSAGE_PROCESSED: 'DEVICE_RAW_MESSAGE_PROCESSED',
  DEVICE_RAW_MESSAGE_ERROR: 'DEVICE_RAW_MESSAGE_ERROR',
  DEVICE_CONTINUE_UNPROCESSED_RAW_DATA: 'DEVICE_CONTINUE_UNPROCESSED_RAW_DATA',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify that a device has posted some raw data.
 *
 * deviceApiRawId is required.
 */
function deviceRawMessagePosted(deviceApiRawId) {
  if (!deviceApiRawId) {
    throw new Error('Must specify deviceApiRawId for deviceRawMessagePosted')
  }
  return {
    type: types.DEVICE_RAW_MESSAGE_POSTED,
    deviceApiRawId,
  }
}

/**
 * Creates an action to notify that raw data has
 * been saved and that the server can respond to
 * the client.
 *
 * deviceApiRawId is required.
 * response is the object or value to respond to the client with.
 */
function deviceRawMessageResponseReady(deviceApiRawId, response) {
  if (!deviceApiRawId) {
    throw new Error('Must specify deviceApiRawId for deviceRawMessagePosted')
  }
  return {
    type: types.DEVICE_RAW_MESSAGE_RESPONSE_READY,
    deviceApiRawId,
    response,
  }
}

/**
 * Creates an action to notify that raw data, posted by a device has been handled
 * and that the web server can respond.
 *
 * deviceApiRawId is required.
 */
function deviceRawMessageProcessed(deviceApiRawId) {
  if (!deviceApiRawId) {
    throw new Error('Must specify deviceApiRawId for deviceRawResponseReady')
  }
  return {
    type: types.DEVICE_RAW_MESSAGE_PROCESSED,
    deviceApiRawId,
  }
}

/**
 * Creates an action to notify that the handling of raw data,
 * posted by a device has encountered an error
 *
 * deviceApiRawId is required.
 * error is the exception or error that was raised
 */
function deviceRawMessageError(deviceApiRawId, error) {
  if (!deviceApiRawId) {
    throw new Error('Must specify deviceApiRawId for deviceRawResponseReady')
  }
  return {
    type: types.DEVICE_RAW_MESSAGE_ERROR,
    deviceApiRawId,
    error,
  }
}

/**
 * Try to finish processing of data in table `deviceRawData`
 */
function tryToContinueUnprocessedRawData() {
  return {
    type: types.DEVICE_CONTINUE_UNPROCESSED_RAW_DATA,
  }
}

module.exports = {
  types,
  deviceRawMessagePosted,
  deviceRawMessageResponseReady,
  deviceRawMessageProcessed,
  deviceRawMessageError,
  tryToContinueUnprocessedRawData,
}
