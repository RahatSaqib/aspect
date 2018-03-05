// ----------- Action Types ---------------------
const types = {
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the device with given id
 * has been marked offline.
 *
 * deviceId is required.
 */
function deviceOffline(deviceId) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for notify deviceOffline')
  }
  return {
    type: types.DEVICE_OFFLINE,
    deviceId,
  }
}

module.exports = {
  types,
  deviceOffline,
}
