// ----------- Action Types ---------------------
const types = {
  RESULT_UPDATED: 'RESULT_UPDATED',
  RESULT_LOGGED: 'RESULT_LOGGED',
  RESULT_MODULE_ERROR: 'RESULT_MODULE_ERROR',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the result with given id
 * has been updated.
 *
 * resultId is required.
 * deviceLogId is optional, specified if update is already
 * associated with a device log entry (NOTE if not specified,
 * device API listener will create one)
 */
function resultUpdated(resultId, deviceLogId) {
  if (resultId == null) {
    throw new Error('Must specify resultId for notifyResultUpdated')
  }
  return {
    type: types.RESULT_UPDATED,
    resultId,
    deviceLogId,
  }
}

/**
 * Creates an action to notify the result with given id
 * has been logged in the DeviceLog.
 *
 * resultId is required
 * deviceLogId is required
 */
function resultLogged(resultId, deviceLogId) {
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

/**
 * Creates an action to notify the device with given id
 * has a module error issue
 *
 * deviceId is required.
 */
function resultModuleError(deviceId) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for notify resultModuleError')
  }
  return {
    type: types.RESULT_MODULE_ERROR,
    deviceId,
  }
}

module.exports = {
  types,
  resultUpdated,
  resultLogged,
  resultModuleError,
}
