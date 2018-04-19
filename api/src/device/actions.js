// ----------- Action Types ---------------------
const types = {
  DEVICE_SEEN: 'DEVICE_SEEN',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  DEVICE_ONLINE: 'DEVICE_ONLINE',
}

// ----------- Action Creators -------------------
//

/**
 * Creates an action to notify the device has communicated
 * with Aspect (e.g. through the Device API)
 *
 * deviceId is required.
 */
function deviceSeen(deviceId) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for notify deviceSeen')
  }
  return {
    type: types.DEVICE_SEEN,
    deviceId,
  }
}

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

/**
 * Creates an action to notify the device with given id
 * has been marked online.
 *
 * deviceId is required.
 */
function deviceOnline(deviceId) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for notify deviceOnline')
  }
  return {
    type: types.DEVICE_ONLINE,
    deviceId,
  }
}

module.exports = {
  types,
  deviceSeen,
  deviceOffline,
  deviceOnline,
}
