// ----------- Action Types ---------------------
const types = {
  DEVICE_SEEN: 'DEVICE_SEEN',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  DEVICE_ONLINE: 'DEVICE_ONLINE',
  DEVICE_NO_RESULTS: 'DEVICE_NO_RESULTS',
  DEVICE_HAS_NEW_RESULTS: 'DEVICE_HAS_NEW_RESULTS',
  DEVICE_MAINTENANCE: 'DEVICE_MAINTENANCE',
  DEVICE_MAINTENANCE_RESOLVED: 'DEVICE_MAINTENANCE_RESOLVED',
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
 * Creates an action to notify the device maintenance.
 *
 * deviceId is required.
 *
 * options:
 *  dueOn: date maintenance status likely to be resolved, default null (unknown)
 *  data: Optional additional maintenance data to record, plain object
 */
function deviceMaintenance(deviceId, options) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for notify deviceMaintenance')
  }
  return {
    type: types.DEVICE_MAINTENANCE,
    deviceId,
    options,
  }
}

/**
 * Creates an action to notify the device maintenance has been resolved.
 *
 * deviceId is required.
 */
function deviceMaintenanceResolved(deviceId) {
  if (deviceId == null) {
    throw new Error(
      'Must specify deviceId for notify deviceMaintenanceResolved'
    )
  }
  return {
    type: types.DEVICE_MAINTENANCE_RESOLVED,
    deviceId,
  }
}

/**
 * Creates an action to notify the device with given id
 * has been marked offline.
 *
 * deviceId is required.
 *
 * options:
 *    lastSeenOn: date device last seen
 *    lastPingOn: date device last ping
 */
function deviceOffline(deviceId, options) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for notify deviceOffline')
  }
  return {
    type: types.DEVICE_OFFLINE,
    deviceId,
    options,
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

/**
 * Creates an action to notify the device has seen new
 * results after notifying deviceNoResults
 *
 * deviceId is required.
 */
function deviceHasNewResults(deviceId) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for notify deviceHasNewResults')
  }
  return {
    type: types.DEVICE_HAS_NEW_RESULTS,
    deviceId,
  }
}

module.exports = {
  types,
  deviceSeen,
  deviceMaintenance,
  deviceMaintenanceResolved,
  deviceOffline,
  deviceOnline,
  deviceNoResults,
  deviceHasNewResults,
}
