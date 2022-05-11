const _ = require('lodash')

// ----------- Action Types ---------------------
const types = {
  DEVICE_SEEN: 'DEVICE_SEEN',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  DEVICE_ONLINE: 'DEVICE_ONLINE',
  DEVICE_NO_RESULTS: 'DEVICE_NO_RESULTS',
  DEVICE_HAS_NEW_RESULTS: 'DEVICE_HAS_NEW_RESULTS',
  DEVICE_MAINTENANCE: 'DEVICE_MAINTENANCE',
  DEVICE_MAINTENANCE_RESOLVED: 'DEVICE_MAINTENANCE_RESOLVED',
  DEVICE_MAINTENANCE_STATUS_LOGGED: 'DEVICE_MAINTENANCE_STATUS_LOGGED',
  DEVICE_MAINTENANCE_STATUS_LOG_SCHEDULED:
    'DEVICE_MAINTENANCE_STATUS_LOG_SCHEDULED',
  DEVICE_MODULE_DISABLE_RECEIVED: 'DEVICE_MODULE_DISABLE_RECEIVED',
  DEVICE_INSTRUMENT_REPLACED: 'DEVICE_INSTRUMENT_REPLACED',
  DEVICE_UNUSED_MODULES: 'DEVICE_UNUSED_MODULES',
  HARDWARE_SYRINGE_STALL_ERROR: 'HARDWARE_SYRINGE_STALL_ERROR', // 2005
  HARDWARE_SYRINGE_PRESSURE_TOOHIGH: 'HARDWARE_SYRINGE_PRESSURE_TOOHIGH', // 2008
  HARDWARE_ULTRASONIC_HORN_CURRENT_OUT_OF_RANGE:
    'HARDWARE_ULTRASONIC_HORN_CURRENT_OUT_OF_RANGE', // 2026
  HARDWARE_ULTRASONIC_HORN_TUNING_ERROR:
    'HARDWARE_ULTRASONIC_HORN_TUNING_ERROR', // 2032
  HARDWARE_ULTRASONIC_HORN_FAILURE: 'HARDWARE_ULTRASONIC_HORN_FAILURE', // 2035
  HARDWARE_CARTRIDGE_INTEGRITY_TEST_FAILURE:
    'HARDWARE_CARTRIDGE_INTEGRITY_TEST_FAILURE', // 2037
  HARDWARE_ASSAY_SPECIFIC_TERMINATION_ERROR:
    'HARDWARE_ASSAY_SPECIFIC_TERMINATION_ERROR', // 2096
  HARDWARE_ASSAY_SPECIFIC_TERMINATION_ERROR_2:
    'HARDWARE_ASSAY_SPECIFIC_TERMINATION_ERROR_2', // 2097
  HARDWARE_MODULE_WAS_RESET: 'HARDWARE_MODULE_WAS_RESET', // 2126
  HARDWARE_POWER_SUPPLY_VOLTAGE_OUT_OF_RANGE:
    'HARDWARE_POWER_SUPPLY_VOLTAGE_OUT_OF_RANGE', // 4008
  HARDWARE_TEMPERATURE_ERRORS: 'HARDWARE_TEMPERATURE_ERRORS', // 4017
}

const hardwareErrorActions = {
  1001: types.HARDWARE_TEMPERATURE_ERRORS,
  1002: types.HARDWARE_TEMPERATURE_ERRORS,
  1004: types.HARDWARE_TEMPERATURE_ERRORS,
  2005: types.HARDWARE_SYRINGE_STALL_ERROR,
  2014: types.HARDWARE_TEMPERATURE_ERRORS,
  2026: types.HARDWARE_ULTRASONIC_HORN_CURRENT_OUT_OF_RANGE,
  2032: types.HARDWARE_ULTRASONIC_HORN_TUNING_ERROR,
  2035: types.HARDWARE_ULTRASONIC_HORN_FAILURE,
  2037: types.HARDWARE_CARTRIDGE_INTEGRITY_TEST_FAILURE,
  2126: types.HARDWARE_MODULE_WAS_RESET,
  4008: types.HARDWARE_POWER_SUPPLY_VOLTAGE_OUT_OF_RANGE,
  4009: types.HARDWARE_TEMPERATURE_ERRORS,
  4012: types.HARDWARE_TEMPERATURE_ERRORS,
  4017: types.HARDWARE_TEMPERATURE_ERRORS,
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
  if (!deviceId) {
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
  if (!deviceId) {
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
  if (!deviceId) {
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
  if (!deviceId) {
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
  if (!deviceId) {
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
 * options:
 *    lastResultOn: date of last result for device
 */
function deviceNoResults(deviceId, options) {
  if (!deviceId) {
    throw new Error('Must specify deviceId for notify deviceNoResults')
  }
  return {
    type: types.DEVICE_NO_RESULTS,
    deviceId,
    options,
  }
}

/**
 * Creates an action to notify the device has seen new
 * results after notifying deviceNoResults
 *
 * deviceId is required.
 */
function deviceHasNewResults(deviceId) {
  if (!deviceId) {
    throw new Error('Must specify deviceId for notify deviceHasNewResults')
  }
  return {
    type: types.DEVICE_HAS_NEW_RESULTS,
    deviceId,
  }
}

/**
 * Creates an action to notify an update about modules disable
 * @param {*} deviceId
 * @param {*} moduleSerial // the serial number of the module which is disable
 * @param {*} disabledOn // the date when this module was disable
 */
function deviceModuleDisabled(device, moduleSerial, disabledOn) {
  if (!device || !moduleSerial || !disabledOn) {
    throw new Error(
      'Must specify deviceId, moduleSerial and disabledOn and for deviceModuleDisable'
    )
  }
  return {
    type: types.DEVICE_MODULE_DISABLE_RECEIVED,
    deviceId: device.id,
    siteId: device.siteId,
    geographyId: device.geographyId,
    partnerId: device.partnerId,
    options: { data: { moduleSerial, disabledOn } },
  }
}

/**
 * Creates an action to notify an update about modules unused
 * @param {*} device
 */
function deviceModuleUnused(deviceId) {
  if (!deviceId) {
    throw new Error('Must specify the device for deviceModuleUnused')
  }
  return {
    type: types.DEVICE_UNUSED_MODULES,
    deviceId,
  }
}

/**
 * Creates an action to notify that an instrument in the given device
 * was replaced
 *
 * @param {*} device
 * @param {*} instrumentSerial the serial number of the instrument replaced
 */
function deviceInstrumentReplaced(device, options) {
  if (!device && !options) {
    throw new Error(
      'Must specify device and options for deviceInstrumentReplaced'
    )
  }
  const issueProps = _.pick(device, [
    'deviceId',
    'siteId',
    'geographyId',
    'partnerId',
    'resultId',
  ])
  return {
    ...issueProps,
    type: types.DEVICE_INSTRUMENT_REPLACED,
    options: { data: options },
  }
}

/**
 * Creates an action to notify the device has a
 * maintenance status update
 *
 * deviceMaintenanceStatusLogId is required.
 */
function deviceMaintenanceStatusLogged(deviceMaintenanceStatusLogId) {
  if (!deviceMaintenanceStatusLogId) {
    throw new Error(
      'Must specify deviceMaintenanceStatusLogId for deviceMaintenanceStatusLogged'
    )
  }
  return {
    type: types.DEVICE_MAINTENANCE_STATUS_LOGGED,
    deviceMaintenanceStatusLogId,
  }
}

/**
 * Creates an action to notify that it is time
 * to log the maintenance status of unlogged
 * devices
 */
function logDeviceMaintenanceStatus(today = null) {
  return {
    type: types.DEVICE_MAINTENANCE_STATUS_LOG_SCHEDULED,
    today,
    dailyRun: !today,
  }
}

/**
 * Creates an action to notify that hardware error happened in the given device
 *
 * @param device
 * @param actionType - action type to trigger, see prop 'triggerConditions.action'
 *                    in /seeds/fixtures/IssueEventTrigger.json for 'Hardware*' issueTypes
 * @param options - parameters for the hardware error
 */
function deviceHardwareError(device, resultErrorCode, options) {
  if (
    !device ||
    !resultErrorCode ||
    !options ||
    !hardwareErrorActions[resultErrorCode]
  ) {
    throw new Error(
      'Must specify device, resultErrorCode and options for deviceHardwareError'
    )
  }
  const { id: deviceId, siteId, geographyId, partnerId } = device
  return {
    type: hardwareErrorActions[resultErrorCode],
    deviceId,
    siteId,
    geographyId,
    partnerId,
    options: { data: { ...options, resultErrorCode } },
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
  deviceMaintenanceStatusLogged,
  logDeviceMaintenanceStatus,
  deviceModuleDisabled,
  deviceInstrumentReplaced,
  deviceModuleUnused,
  deviceHardwareError,
  hardwareErrorActions,
}
