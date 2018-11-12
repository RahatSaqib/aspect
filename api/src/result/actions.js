// ----------- Action Types ---------------------
const types = {
  RESULT_UPDATED: 'RESULT_UPDATED',
  RESULT_LOGGED: 'RESULT_LOGGED',
  RESULT_MODULE_TEMPERATURE_ERROR: 'RESULT_MODULE_TEMPERATURE_ERROR',
  RESULT_MODULE_POWER_ERROR: 'RESULT_MODULE_POWER_ERROR',
  RESULT_MODULE_FAILURE_ERROR: 'RESULT_MODULE_FAILURE_ERROR',
  RESULT_MACHINE_TEMPERATURE_ERROR: 'RESULT_MACHINE_TEMPERATURE_ERROR',
  RESULT_MODULE_PROCEDURAL_ERROR: 'RESULT_MODULE_PROCEDURAL_ERROR',
  RESULT_MACHINE_PROCEDURAL_ERROR: 'RESULT_MACHINE_PROCEDURAL_ERROR',
  RESULT_MACHINE_POWER_ERROR: 'RESULT_MACHINE_POWER_ERROR',
  RESULT_MODULE_UNKNOWN_ERROR: 'RESULT_MODULE_UNKNOWN_ERROR',
  RESULT_MACHINE_UNKNOWN_ERROR: 'RESULT_MACHINE_UNKNOWN_ERROR',
  RESULT_MODULE_REPLACED: 'RESULT_MODULE_REPLACED',
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
    throw new Error('Must specify resultId for resultUpdated')
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
    throw new Error('Must specify resultId and deviceLogId for resultLogged')
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
 * options:
 *   moduleName
 *   moduleSerial
 */
function resultModuleTemperatureError(deviceId, options) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for resultModuleTemperatureError')
  }
  return {
    type: types.RESULT_MODULE_TEMPERATURE_ERROR,
    deviceId,
    options,
  }
}

/**
 * Creates an action to notify the device with given id
 * has a module power error issue
 *
 * deviceId is required.
 * options:
 *   moduleName
 *   moduleSerial
 */
function resultModulePowerError(deviceId, options) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for resultModulePowerError')
  }
  return {
    type: types.RESULT_MODULE_POWER_ERROR,
    deviceId,
    options,
  }
}

/**
 * Creates an action to notify the device with given id
 * has an active module failure issue
 *
 * deviceId is required.
 * options:
 *   moduleName
 *   moduleSerial
 */
function resultModuleFailureError(deviceId, options) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for resultModuleFailureError')
  }
  return {
    type: types.RESULT_MODULE_FAILURE_ERROR,
    deviceId,
    options,
  }
}

/**
 * Creates an action to notify the device with given id
 * has an active machine temperature issue
 *
 * deviceId is required.
 */
function resultMachineTemperatureError(deviceId) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for resultMachineTemperatureError')
  }
  return {
    type: types.RESULT_MACHINE_TEMPERATURE_ERROR,
    deviceId,
  }
}

/**
 * Creates an action to notify the device with given id
 * has an active module procedural issue
 *
 * deviceId is required.
 * options:
 *   moduleName
 *   moduleSerial
 */
function resultModuleProceduralError(deviceId, options) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for resultModuleProceduralError')
  }
  return {
    type: types.RESULT_MODULE_PROCEDURAL_ERROR,
    deviceId,
    options,
  }
}

/**
 * has a machine power error issue
 *
 * deviceId is required.
 */
function resultMachinePowerError(deviceId) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for resultMachinePowerError')
  }
  return {
    type: types.RESULT_MACHINE_POWER_ERROR,
    deviceId,
  }
}

/**
 * Creates an action to notify the device with given id
 * has an active machine procedural issue
 *
 * deviceId is required.
 */
function resultMachineProceduralError(deviceId) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for resultMachineProceduralError')
  }
  return {
    type: types.RESULT_MACHINE_PROCEDURAL_ERROR,
    deviceId,
  }
}

/**
 * Creates an action to notify the device with given id
 * has a module issue with unknown error
 *
 * deviceId is required.
 * options:
 *   moduleName
 *   moduleSerial
 */
function resultModuleUnknownError(deviceId, options) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for resultModuleUnknownError')
  }
  return {
    type: types.RESULT_MODULE_UNKNOWN_ERROR,
    deviceId,
    options,
  }
}

/**
 * Creates an action to notify the device with given id
 * has issue(s) with unknown error code
 *
 * deviceId is required.
 */
function resultMachineUnknownError(deviceId) {
  if (deviceId == null) {
    throw new Error('Must specify deviceId for resultMachineUnknownError')
  }
  return {
    type: types.RESULT_MACHINE_UNKNOWN_ERROR,
    deviceId,
  }
}

/**
 * Creates an action to notify that a module in the given
 * slot (= moduleName) was replaced
 *
 * resultId is required
 */
function resultModuleReplaced(resultId, options) {
  if (resultId == null) {
    throw new Error('Must specify resultId for resultModuleReplaced')
  }
  return {
    type: types.RESULT_MODULE_REPLACED,
    resultId,
    options,
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
  resultMachineProceduralError,
  resultModuleProceduralError,
  resultMachinePowerError,
  resultModuleUnknownError,
  resultMachineUnknownError,
  resultModuleReplaced,
}
