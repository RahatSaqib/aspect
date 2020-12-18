const _ = require('lodash')
// ----------- Action Types ---------------------
const types = {
  RESULT_UPDATED: 'RESULT_UPDATED',
  RESULT_LOGGED: 'RESULT_LOGGED',
  RESULT_LOGGED_PROCESSED: 'RESULT_LOGGED_PROCESSED',
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
  RESULT_ANALYZE_PROBES: 'RESULT_ANALYZE_PROBES',
  RESULT_ANALYZE_PROBES_HIGH: 'RESULT_ANALYZE_PROBES_HIGH',
  FAILED_TO_VERIFY_VALID_BACKGROUND_ERROR_FOR_ANALYTE:
    'FAILED_TO_VERIFY_VALID_BACKGROUND_ERROR_FOR_ANALYTE',
  RESULT_ANALYZE_PROBES_FAILED: 'RESULT_ANALYZE_PROBES_FAILED',
  RESULT_ANALYZE_INVALIDS: 'RESULT_ANALYZE_INVALIDS',
  RESULT_ANALYZE_SIGNAL_LOSS_AMP_CURVE: 'RESULT_ANALYZE_SIGNAL_LOSS_AMP_CURVE',
  RESULT_UNUSED_MODULES: 'RESULT_UNUSED_MODULES',
  RESULT_ANALYZE_CARTRIDGE_INTEGRITY_TEST_FAILURE:
    'RESULT_ANALYZE_CARTRIDGE_INTEGRITY_TEST_FAILURE',
  RESULT_ANALYZE_SYRINGE_PRESSURE_TOO_HIGH:
    'RESULT_ANALYZE_SYRINGE_PRESSURE_TOO_HIGH',
  RESULT_ANALYZE_SYRINGE_STALL_ERROR: 'RESULT_ANALYZE_SYRINGE_STALL_ERROR',
  RESULT_ANALYZE_ULTRASONIC_HORN_FAILURE:
    'RESULT_ANALYZE_ULTRASONIC_HORN_FAILURE',
  RESULT_ANALYZE_ULTRASONIC_HORN_TUNING_ERROR:
    'RESULT_ANALYZE_ULTRASONIC_HORN_TUNING_ERROR',
  RESULT_ANALYZE_ULTRASONIC_HORN_CURRENT_OUT_RANGE:
    'RESULT_ANALYZE_ULTRASONIC_HORN_CURRENT_OUT_RANGE',
  RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_ERROR:
    'RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_ERROR',
  RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION:
    'RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION',
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
function resultUpdated(resultId, deviceLogId, userId) {
  if (!resultId) {
    throw new Error('Must specify resultId for resultUpdated')
  }
  return {
    type: types.RESULT_UPDATED,
    resultId,
    deviceLogId,
    userId,
  }
}

const obtainProperAction = ({ errorCode = null, resultCategoryId }) => {
  const valueToCompare =
    errorCode && !_.isNaN(parseInt(errorCode, 10))
      ? parseInt(errorCode, 10)
      : resultCategoryId.toUpperCase()

  switch (valueToCompare) {
    case 5001:
    case 5002:
    case 5003:
    case 5004:
    case 5005:
    case 5015:
    case 5016:
    case 'INVALID':
      return types.RESULT_ANALYZE_INVALIDS

    case 2005:
      return types.RESULT_ANALYZE_SYRINGE_STALL_ERROR
    case 2008:
      return types.RESULT_ANALYZE_SYRINGE_PRESSURE_TOO_HIGH
    case 2026:
      return types.RESULT_ANALYZE_ULTRASONIC_HORN_CURRENT_OUT_RANGE

    case 2032:
      return types.RESULT_ANALYZE_ULTRASONIC_HORN_TUNING_ERROR
    case 2035:
      return types.RESULT_ANALYZE_ULTRASONIC_HORN_FAILURE
    case 2037:
      return types.RESULT_ANALYZE_CARTRIDGE_INTEGRITY_TEST_FAILURE
    case 2096:
      return types.RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_ERROR
    case 2097:
      return types.RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION
    case 5011:
      return types.RESULT_ANALYZE_SIGNAL_LOSS_AMP_CURVE
    case 5006:
      return types.RESULT_ANALYZE_PROBES_HIGH
    case 5007:
    case 5017:
      return types.RESULT_ANALYZE_PROBES_FAILED

    default:
      return types.RESULT_ANALYZE_PROBES
  }
}
/**
 *
 * @param {*} deviceId
 * is the id of the device which generates the result with error

 * @param {*} resultId
 * is the id of the result which generates the result with error

 * @param {*} resultErrorCode
 * the error code number received in the result

 * @param {*} data
 * options should have moduleSerial, resultErrorCode, lot and assay
 * Creates an action to notify the result with given id
 * has been logged with an error code.
 *
 * resultId,  data.resultErrorCode and data.moduleSerial or  data.consumableLot and data.assayId are required.

 */

function resultAnalyzeCategoriesAndErrors(
  deviceId,
  resultId,
  resultCategoryId,
  resultErrorCode,
  data
) {
  if (!deviceId && !(resultCategoryId && resultErrorCode)) {
    throw new Error(
      'Must specify deviceId and resultCategoryId for resultAnalyzeInvalids'
    )
  }
  const actionType = obtainProperAction({
    resultCategoryId,
    errorCode: resultErrorCode,
  })

  return {
    type: actionType,
    deviceId,
    resultId,
    options: {
      data: { ...data, resultCategoryId, resultErrorCode },
    },
  }
}

/**
 * Creates an action to notify the result with given id
 * has been logged in the DeviceLog.
 *
 * resultId is required
 * deviceLogId is required
 * userId is not required
 */
function resultLogged(resultId, deviceLogId, userId) {
  if (!resultId || !deviceLogId) {
    throw new Error('Must specify resultId and deviceLogId for resultLogged')
  }
  return {
    type: types.RESULT_LOGGED,
    resultId,
    deviceLogId,
    userId,
  }
}

/**
 * Creates an action to notify the result & device log
 * with given ids have been processed by any onResultLogged
 * plugins that have been configured
 *
 * resultId is required
 * deviceLogId is required
 */
function resultLoggedProcessed(resultId, deviceLogId) {
  if (!resultId || !deviceLogId) {
    throw new Error(
      'Must specify resultId and deviceLogId for resultLoggedProcessed'
    )
  }
  return {
    type: types.RESULT_LOGGED_PROCESSED,
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
  if (!deviceId) {
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
  if (!deviceId) {
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
  if (!deviceId) {
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
  if (!deviceId) {
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
  if (!deviceId) {
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
  if (!deviceId) {
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
  if (!deviceId) {
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
  if (!deviceId) {
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
  if (!deviceId) {
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
  if (!resultId) {
    throw new Error('Must specify resultId for resultModuleReplaced')
  }
  return {
    type: types.RESULT_MODULE_REPLACED,
    resultId,
    options,
  }
}

function resultUnusedModules(deviceId) {
  if (!deviceId) {
    throw new Error('Must specify deviceId for resultUnusedModules')
  }
  return {
    type: types.RESULT_UNUSED_MODULES,
    deviceId,
  }
}

module.exports = {
  types,
  resultUpdated,
  resultLogged,
  resultLoggedProcessed,
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
  resultAnalyzeCategoriesAndErrors,
  resultUnusedModules,
}
