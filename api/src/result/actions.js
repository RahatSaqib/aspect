const isNil = require('lodash/isNil')
// ----------- Action Types ---------------------
const types = {
  RESULT_UPDATED: 'RESULT_UPDATED',
  RESULT_LOGGED: 'RESULT_LOGGED',
  RESULT_MODULE_TEMPERATURE_ERROR: 'RESULT_MODULE_TEMPERATURE_ERROR',
  RESULT_MODULE_POWER_ERROR: 'RESULT_MODULE_POWER_ERROR',
  RESULT_MODULE_FAILURE_ERROR: 'RESULT_MODULE_FAILURE_ERROR',
  RESULT_DATA_CATEGORY_LOW_CHECK: 'RESULT_DATA_CATEGORY_LOW_CHECK',
  RESULT_DATA_CATEGORY_IS_LOW: 'RESULT_DATA_CATEGORY_IS_LOW',
  RESULT_MACHINE_TEMPERATURE_ERROR: 'RESULT_MACHINE_TEMPERATURE_ERROR',
  RESULT_MODULE_PROCEDURAL_ERROR: 'RESULT_MODULE_PROCEDURAL_ERROR',
  RESULT_MACHINE_PROCEDURAL_ERROR: 'RESULT_MACHINE_PROCEDURAL_ERROR',
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
 * options:
 *   moduleName
 *   moduleSerial
 */
function resultModuleTemperatureError(deviceId, options) {
  if (deviceId == null) {
    throw new Error(
      'Must specify deviceId for notify resultModuleTemperatureError'
    )
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
    throw new Error('Must specify deviceId for notify resultModulePowerError')
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
    throw new Error('Must specify deviceId for notify resultModuleFailureError')
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
 * Creates an action to check data categories for 'low percentage' issue
 * Is called from scheduler
 */
function resultDataCategoryLowCheck() {
  return {
    type: types.RESULT_DATA_CATEGORY_LOW_CHECK,
  }
}

/**
 * Creates an action to notify the site with given id
 * has low given data category issue for given period
 *
 * dataCategoryId, categoryName, periodName, siteId, percentage are required.
 */
function resultDataCategoryLow({
  dataCategoryId,
  categoryName,
  periodName,
  siteId,
  percentage,
}) {
  if (
    !dataCategoryId ||
    !categoryName ||
    !periodName ||
    !siteId ||
    isNil(percentage)
  ) {
    throw new Error(
      'Must specify each parameter - dataCategoryId, categoryName, periodName, siteId, percentage - for Data Category Low notification'
    )
  }
  return {
    type: types.RESULT_DATA_CATEGORY_IS_LOW,
    siteId,
    options: {
      dataCategoryId,
      categoryName,
      periodName,
      siteId,
      percentage,
    },
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
    throw new Error(
      'Must specify deviceId for notify resultModuleProceduralError'
    )
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
    throw new Error('Must specify deviceId for notify resultMachinePowerError')
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
    throw new Error(
      'Must specify deviceId for notify resultMachineProceduralError'
    )
  }
  return {
    type: types.RESULT_MACHINE_PROCEDURAL_ERROR,
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
  resultDataCategoryLowCheck,
  resultDataCategoryLow,
  resultMachineTemperatureError,
  resultMachineProceduralError,
  resultModuleProceduralError,
  resultMachinePowerError,
}
