const _ = require('lodash')
// ----------- Action Types ---------------------
const types = {
  RESULT_LOGGED: 'RESULT_LOGGED',
  RESULT_READY_FOR_NOTIFICATION: 'RESULT_READY_FOR_NOTIFICATION',
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
  RESULT_ANALYZE_PROBES_LOT: 'RESULT_ANALYZE_PROBES_LOT',
  RESULT_ANALYZE_PROBES_MODULE: 'RESULT_ANALYZE_PROBES_MODULE',
  RESULT_ANALYZE_PROBES_HIGH_LOT: 'RESULT_ANALYZE_PROBES_HIGH_LOT',
  RESULT_ANALYZE_PROBES_HIGH_MODULE: 'RESULT_ANALYZE_PROBES_HIGH_MODULE',
  FAILED_TO_VERIFY_VALID_BACKGROUND_ERROR_FOR_ANALYTE_LOT: 'FAILED_TO_VERIFY_VALID_BACKGROUND_ERROR_FOR_ANALYTE_LOT',
  FAILED_TO_VERIFY_VALID_BACKGROUND_ERROR_FOR_ANALYTE_MODULE:
    'FAILED_TO_VERIFY_VALID_BACKGROUND_ERROR_FOR_ANALYTE_MODULE',
  RESULT_ANALYZE_PROBES_FAILED_LOT: 'RESULT_ANALYZE_PROBES_FAILED_LOT',
  RESULT_ANALYZE_PROBES_FAILED_MODULE: 'RESULT_ANALYZE_PROBES_FAILED_MODULE',
  RESULT_ANALYZE_INVALIDS_MODULE: 'RESULT_ANALYZE_INVALIDS_MODULE',
  RESULT_ANALYZE_INVALIDS_LOT: 'RESULT_ANALYZE_INVALIDS_LOT',
  RESULT_ANALYZE_SIGNAL_LOSS_AMP_CURVE_LOT: 'RESULT_ANALYZE_SIGNAL_LOSS_AMP_CURVE_LOT',
  RESULT_ANALYZE_SIGNAL_LOSS_AMP_CURVE_MODULE: 'RESULT_ANALYZE_SIGNAL_LOSS_AMP_CURVE_MODULE',
  RESULT_UNUSED_MODULES: 'RESULT_UNUSED_MODULES',
  RESULT_ANALYZE_CARTRIDGE_INTEGRITY_TEST_FAILURE_MODULE: 'RESULT_ANALYZE_CARTRIDGE_INTEGRITY_TEST_FAILURE_MODULE',
  RESULT_ANALYZE_CARTRIDGE_INTEGRITY_TEST_FAILURE_LOT: 'RESULT_ANALYZE_CARTRIDGE_INTEGRITY_TEST_FAILURE_LOT',
  RESULT_ANALYZE_SYRINGE_PRESSURE_TOO_HIGH_MODULE: 'RESULT_ANALYZE_SYRINGE_PRESSURE_TOO_HIGH_MODULE',
  RESULT_ANALYZE_SYRINGE_PRESSURE_TOO_HIGH_LOT: 'RESULT_ANALYZE_SYRINGE_PRESSURE_TOO_HIGH_LOT',
  RESULT_ANALYZE_SYRINGE_STALL_ERROR_MODULE: 'RESULT_ANALYZE_SYRINGE_STALL_ERROR_MODULE',
  RESULT_ANALYZE_SYRINGE_STALL_ERROR_LOT: 'RESULT_ANALYZE_SYRINGE_STALL_ERROR_LOT',
  RESULT_ANALYZE_ULTRASONIC_HORN_FAILURE_MODULE: 'RESULT_ANALYZE_ULTRASONIC_HORN_FAILURE_MODULE',
  RESULT_ANALYZE_ULTRASONIC_HORN_FAILURE_LOT: 'RESULT_ANALYZE_ULTRASONIC_HORN_FAILURE_LOT',
  RESULT_ANALYZE_ULTRASONIC_HORN_TUNING_ERROR_MODULE: 'RESULT_ANALYZE_ULTRASONIC_HORN_TUNING_ERROR_MODULE',
  RESULT_ANALYZE_ULTRASONIC_HORN_TUNING_ERROR_LOT: 'RESULT_ANALYZE_ULTRASONIC_HORN_TUNING_ERROR_LOT',
  RESULT_ANALYZE_ULTRASONIC_HORN_CURRENT_OUT_RANGE_MODULE: 'RESULT_ANALYZE_ULTRASONIC_HORN_CURRENT_OUT_RANGE_MODULE',
  RESULT_ANALYZE_ULTRASONIC_HORN_CURRENT_OUT_RANGE_LOT: 'RESULT_ANALYZE_ULTRASONIC_HORN_CURRENT_OUT_RANGE_LOT',
  RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_ERROR_MODULE: 'RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_ERROR_MODULE',
  RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_ERROR_LOT: 'RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_ERROR_LOT',
  RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_LOT: 'RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_LOT',
  RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_MODULE: 'RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_MODULE',
}

// ----------- Action Creators -------------------

const obtainProperAction = (
  consumableLot,
  {
    errorCode = null,
    resultCategoryId, // <-- this is result category externalid
  }
) => {
  const valueToCompare =
    errorCode && !_.isNaN(parseInt(errorCode, 10)) ? parseInt(errorCode, 10) : resultCategoryId.toUpperCase()

  switch (valueToCompare) {
    case 5001:
    case 5002:
    case 5003:
    case 5004:
    case 5005:
    case 5015:
    case 5016:
    case 'INVALID':
      return !consumableLot ? types.RESULT_ANALYZE_INVALIDS_MODULE : types.RESULT_ANALYZE_INVALIDS_LOT

    case 2005:
      return !consumableLot
        ? types.RESULT_ANALYZE_SYRINGE_STALL_ERROR_MODULE
        : types.RESULT_ANALYZE_SYRINGE_STALL_ERROR_LOT
    case 2008:
      return !consumableLot
        ? types.RESULT_ANALYZE_SYRINGE_PRESSURE_TOO_HIGH_MODULE
        : types.RESULT_ANALYZE_SYRINGE_PRESSURE_TOO_HIGH_LOT

    case 2026:
      return !consumableLot
        ? types.RESULT_ANALYZE_ULTRASONIC_HORN_CURRENT_OUT_RANGE_MODULE
        : types.RESULT_ANALYZE_ULTRASONIC_HORN_CURRENT_OUT_RANGE_LOT

    case 2032:
      return !consumableLot
        ? types.RESULT_ANALYZE_ULTRASONIC_HORN_TUNING_ERROR_MODULE
        : types.RESULT_ANALYZE_ULTRASONIC_HORN_TUNING_ERROR_LOT
    case 2035:
      return !consumableLot
        ? types.RESULT_ANALYZE_ULTRASONIC_HORN_FAILURE_MODULE
        : types.RESULT_ANALYZE_ULTRASONIC_HORN_FAILURE_LOT
    case 2037:
      return !consumableLot
        ? types.RESULT_ANALYZE_CARTRIDGE_INTEGRITY_TEST_FAILURE_MODULE
        : types.RESULT_ANALYZE_CARTRIDGE_INTEGRITY_TEST_FAILURE_LOT
    case 2096:
      return !consumableLot
        ? types.RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_ERROR_MODULE
        : types.RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_ERROR_LOT
    case 2097:
      return !consumableLot
        ? types.RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_MODULE
        : types.RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_LOT
    case 5011:
      return !consumableLot
        ? types.RESULT_ANALYZE_SIGNAL_LOSS_AMP_CURVE_MODULE
        : types.RESULT_ANALYZE_SIGNAL_LOSS_AMP_CURVE_LOT
    case 5006:
      return !consumableLot ? types.RESULT_ANALYZE_PROBES_HIGH_MODULE : types.RESULT_ANALYZE_PROBES_HIGH_LOT
    case 5007:
    case 5017:
      return !consumableLot ? types.RESULT_ANALYZE_PROBES_FAILED_MODULE : types.RESULT_ANALYZE_PROBES_FAILED_LOT

    default:
      return !consumableLot ? types.RESULT_ANALYZE_PROBES_MODULE : types.RESULT_ANALYZE_PROBES_LOT
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
  resultCategoryId, // <-- this is result category externalid
  resultErrorCode,
  data
) {
  if (!deviceId && !(resultCategoryId && resultErrorCode)) {
    throw new Error('Must specify deviceId and resultCategoryId for resultAnalyzeInvalids')
  }
  const consumableLot = _.get(data, 'consumableLot')
  const actionType = obtainProperAction(consumableLot, {
    resultCategoryId, // <-- this is result category externalid
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
 * options is not required, is an object containing additional props
 */
function resultLogged(resultId, deviceLogId, userId, options) {
  if (!resultId || !deviceLogId) {
    throw new Error('Must specify resultId and deviceLogId for resultLogged')
  }
  const { isResultUpdated = false } = options || {}
  return {
    type: types.RESULT_LOGGED,
    resultId,
    deviceLogId,
    userId,
    isResultUpdated,
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
    throw new Error('Must specify resultId and deviceLogId for resultLoggedProcessed')
  }
  return {
    type: types.RESULT_LOGGED_PROCESSED,
    resultId,
    deviceLogId,
  }
}

function resultReadyForNotification(resultId, isResultUpdated = false) {
  if (!resultId) {
    throw new Error('Must specify resultId for resultReadyForNotification')
  }

  return {
    type: types.RESULT_READY_FOR_NOTIFICATION,
    resultId,
    isResultUpdated,
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
function resultModuleReplaced(resultId, deviceId, options) {
  if (!resultId) {
    throw new Error('Must specify resultId for resultModuleReplaced')
  }
  return {
    type: types.RESULT_MODULE_REPLACED,
    deviceId,
    resultId,
    options: { data: options },
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
  resultReadyForNotification,
}
