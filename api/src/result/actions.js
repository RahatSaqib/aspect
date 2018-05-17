// ----------- Action Types ---------------------
const types = {
  RESULT_UPDATED: 'RESULT_UPDATED',
  RESULT_LOGGED: 'RESULT_LOGGED',
  RESULT_MODULE_TEMPERATURE_ERROR: 'RESULT_MODULE_TEMPERATURE_ERROR',
  RESULT_MODULE_POWER_ERROR: 'RESULT_MODULE_POWER_ERROR',
  RESULT_MODULE_FAILURE_ERROR: 'RESULT_MODULE_FAILURE_ERROR',
  RESULT_MACHINE_TEMPERATURE_ERROR: 'RESULT_MACHINE_TEMPERATURE_ERROR',
  RESULT_MODULE_GENERIC_ERROR: 'RESULT_MODULE_GENERIC_ERROR',
  RESULT_MACHINE_POWER_ERROR: 'RESULT_MACHINE_POWER_ERROR',
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
 * has a module temperature error issue
 *
 * deviceId is required.
 */
function resultModuleTemperatureError(deviceId) {
  if (deviceId == null) {
    throw new Error(
      'Must specify deviceId for notify resultModuleTemperatureError'
    )
  }
  return {
    type: types.RESULT_MODULE_TEMPERATURE_ERROR,
    deviceId,
  }
}

/**
 * Creates an action to notify the device with given id
 * has a module power error issue
 *
 * deviceId is required.
 */
function resultModulePowerError(deviceId) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for notify resultModulePowerError')
  }
  return {
    type: types.RESULT_MODULE_POWER_ERROR,
    deviceId,
  }
}

/**
 * Creates an action to notify the device with given id
 * has an active module failure issue
 *
 * deviceId is required.
 */
function resultModuleFailureError(deviceId) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for notify resultModuleFailureError')
  }
  return {
    type: types.RESULT_MODULE_FAILURE_ERROR,
    deviceId,
  }
}

/**
 * Creates an action to notify the device with given id
 * has an active module failure issue
 *
 * deviceId is required.
 */
function resultMachineTemperatureError(deviceId) {
  if (deviceId == null) {
    throw new Error(
      'Must specify deviceId for notify resultMachineTemperatureError'
    )
  }
  return {
    type: types.RESULT_MACHINE_TEMPERATURE_ERROR,
    deviceId,
  }
}

/**
 * Creates an action to notify the device with given id
 * has an active module failure issue
 *
 * deviceId is required.
 */
function resultModuleGenericError(deviceId) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for notify resultModuleGenericError')
  }
  return {
    type: types.RESULT_MODULE_GENERIC_ERROR,
    deviceId,
  }
}

/**
 * has a machine power error issue
 *
 * deviceId is required.
 */
function resultMachinePowerError(deviceId) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for notify resultMachinePowerError')
  }
  return {
    type: types.RESULT_MACHINE_POWER_ERROR,
    deviceId,
  }
}

module.exports = {
  types,
  resultUpdated,
  resultLogged,
  resultModuleTemperatureError,
  resultModulePowerError,
  resultModuleFailureError,
  resultMachineTemperatureError,
  resultModuleGenericError,
  resultMachinePowerError,
}
