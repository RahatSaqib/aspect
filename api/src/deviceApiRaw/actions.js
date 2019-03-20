// ----------- Action Types ---------------------
const types = {
  DEVICE_RAW_MESSAGE_POSTED: 'DEVICE_RAW_MESSAGE_POSTED',
  DEVICE_RAW_MESSAGE_HANDLED: 'DEVICE_RAW_MESSAGE_HANDLED',
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
 * Creates an action to notify that raw data, posted by a device has been handled.
 *
 * deviceApiRawId is required.
 */
function deviceRawMessageHandled(deviceApiRawId) {
  if (!deviceApiRawId) {
    throw new Error('Must specify deviceApiRawId for deviceRawMessageHandled')
  }
  return {
    type: types.DEVICE_RAW_MESSAGE_HANDLED,
    deviceApiRawId,
  }
}

module.exports = {
  deviceRawMessagePosted,
  deviceRawMessageHandled,
}
