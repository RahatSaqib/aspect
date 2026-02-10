const _ = require('lodash')
const { deviceMaintenanceTypeToId, issueTypeToId } = require('../../../shared/dictionary')
const { parseDateOrDefault } = require('../../../shared/date')
const { setDeviceCalibrationStatus } = require('../../../plugin/utils')
const { calibrationDateUpdated } = require('../../../device/actions')

async function updateDeviceConfiguration({ knex, payload, devicesIds, messageContext }) {
  const now = new Date()
  const configurationData = _.omitBy(payload.configuration.data, _.isNull)

  const {
    data: { macAddress, hostId, deviceSerialNumber, culture, timezone },
  } = payload.configuration

  const deviceDetails = {
    macAddress: macAddressValid(macAddress) ? macAddress : null,
    hostId,
    timezone,
    culture,
    serial: deviceSerialNumber,
    configurationData: knex.raw(
      'JSON_MERGE_PATCH(IFNULL(configurationData, "{}"), ?)',
      JSON.stringify(configurationData)
    ),
    lastSeenOn: now,
    lastPingOn: now,
  }

  await knex('Device')
    .whereIn('id', devicesIds)
    .update({
      ..._.omitBy(deviceDetails, _.isNil), // Only update fields that are not null or undefined
      updatedOn: now,
      updatedBy: null,
    })

  if (configurationData.disabledModules) {
    messageContext.bindActionCreators({
      calibrationDateUpdated,
    })

    // TODO
    /*
    await Promise.each(configurationData.disabledModules, modules =>
      shouldTriggerModuleDisabled(knex, messageContext, deviceId, modules)
    )
      */
  }

  if (configurationData.lastCalibrated) {
    // TODO
    // await tryUpdateDeviceMaintenance(knex, deviceId, configurationData.lastCalibrated, messageContext)
  }
}

async function tryUpdateDeviceMaintenance(knex, deviceId, lastCalibrated, messageContext) {
  const deviceMaintenanceTypeId = await deviceMaintenanceTypeToId('calibration')
  const calibratedOn = lastCalibrated ? parseDateOrDefault(lastCalibrated) : null

  if (calibratedOn) {
    await setDeviceCalibrationStatus(knex, deviceId, calibratedOn, {
      deviceMaintenanceTypeId,
      notes: 'From GxConnect basic settings',
    })
    if (!messageContext.calibrationDateUpdated) {
      messageContext.bindActionCreators({
        calibrationDateUpdated,
      })
    }
    messageContext.calibrationDateUpdated(deviceId)
  }
}

function macAddressValid(macAddress) {
  return macAddress && macAddress.indexOf('MAC') === 0 && macAddress.trim().length > 3
}

async function shouldTriggerModuleDisabled(knex, messageContext, deviceId, deviceModule) {
  // only makes sense if the issue type is defined for the country
  const moduleReplacedIssueTypeId = await issueTypeToId('ModuleReplaced')
  if (!moduleReplacedIssueTypeId) return

  /**
   * Check if the module was already replaced
   */
  const moduleReplacedIssue = await knex('Issue')
    .where({
      issueTypeId: moduleReplacedIssueTypeId,
      deviceId,
    })
    .andWhere(
      knex.raw('data->>"$.replacedModuleSerial"=? AND DATE(createdOn)>=DATE(?)', [
        deviceModule.SiteSerialNumber,
        deviceModule.Creation,
      ])
    )
    .first('data')

  /**
   * If the module wasn't replaced already, we trigger the event to create the new issue.
   */
  if (!moduleReplacedIssue) {
    messageContext.deviceModuleDisabled(deviceId, deviceModule.SiteSerialNumber, deviceModule.Creation)
  }
}

module.exports = {
  updateDeviceConfiguration,
}
