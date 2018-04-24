// ----------- Action Types ---------------------
const types = {
  DEVICE_SEEN: 'DEVICE_SEEN',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  DEVICE_ONLINE: 'DEVICE_ONLINE',
  DEVICE_NO_RESULTS: 'DEVICE_NO_RESULTS',
}

// ----------- Action Creators -------------------
//

/**
 * Creates an action to notify the device has communicated
 * with Aspect (e.g. through the Device API)
 *
 * deviceId is required.
 */
function deviceSeen(deviceId, dateSeen) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for notify deviceSeen')
  }
  const action = {
    type: types.DEVICE_SEEN,
    deviceId,
  }
  return dateSeen ? Object.assign({}, action, { dateSeen }) : action
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

/**
 * Creates an action to notify the device has not seen new
 * results for a period of time within Aspect (e.g. through
 * the Device API)
 *
 * deviceId is required.
 */
function deviceNoResults(deviceId) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for notify deviceNoResults')
  }
  return {
    type: types.DEVICE_NO_RESULTS,
    deviceId,
  }
}

module.exports = {
  types,
  deviceSeen,
  deviceOffline,
  deviceOnline,
  deviceNoResults,
}
