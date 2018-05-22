// ----------- Action Types ---------------------
const types = {
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  DEVICE_ONLINE: 'DEVICE_ONLINE',
  DEVICE_NO_RESULTS: 'DEVICE_NO_RESULTS',
  DEVICE_HAS_NEW_RESULTS: 'DEVICE_HAS_NEW_RESULTS',
  DEVICE_MAINTENANCE: 'DEVICE_MAINTENANCE',
}

// ----------- Action Creators -------------------
//

/**
 * Creates an action to notify the device maintenance status.
 *
 * deviceId is required.
 * status is required: the token/externalId of DeviceMaintenanceStatus,
 * e.g. online, offline
 *
 * NOTE: this action is debounced to create tasks related to status updates.
 * most application code should generate deviceMaintenance, but subscribe
 * to other actions for creating additional logic based on the status.
 *
 * options:
 *  data: Optional additional maintenance data to record, plain object
 *  mergeData: Should specified data merge or replace existing data? default false
 *  resolveOn: date maintenance status likely to be resolved, default null (unknown)
 *  changedOn: date maintenance status changed, default now
 *  lastSeenOn: date the actual device was last seen, default now.
 */
function deviceMaintenance(deviceId, status, options) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for notify deviceMaintenance')
  }
  if (status == null) {
    throw new Error('Must specify status for notify deviceMaintenance')
  }
  return {
    type: types.DEVICE_MAINTENANCE,
    deviceId,
    status,
    options,
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
  deviceMaintenance,
  deviceOffline,
  deviceOnline,
  deviceNoResults,
  deviceHasNewResults,
}
