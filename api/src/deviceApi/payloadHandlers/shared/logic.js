const _ = require('lodash')
const { deviceMaintenanceTypeToId, issueTypeToId } = require('../../../shared/dictionary')
const { parseDateOrDefault } = require('../../../shared/date')
const { setDeviceCalibrationStatus } = require('../../../plugin/utils')
const { calibrationDateUpdated, deviceModuleDisabled } = require('../../../device/actions')

async function updateDeviceConfiguration({ knex, payload, deviceIds, messageContext, remoteAddress }) {
  if (deviceIds.length === 0) {
    return
  }

  const now = new Date()
  const configurationData = _.omitBy(payload.configuration.data, _.isNull)

  const {
    data: { macAddress, hostId, deviceSerialNumber, culture, timezone },
  } = payload.configuration

  const deviceDetails = {
    macAddress: macAddressValid(macAddress) ? macAddress : null,
    hostId,
    culture,
    serial: deviceSerialNumber,
    configurationData: knex.raw(
      'JSON_MERGE_PATCH(IFNULL(configurationData, "{}"), ?)',
      JSON.stringify(configurationData)
    ),
    lastPingFromIp: remoteAddress,
    lastPingOn: now,
    lastSeenOn: now,
  }

  if (timezone) {
    const timezoneExists = await knex('TimeZone').where('id', timezone).first('id as existingTimeZone')

    if (timezoneExists) {
      deviceDetails.timezone = timezone
    }
  }

  await knex('Device')
    .whereIn('id', deviceIds)
    .update({
      ..._.omitBy(deviceDetails, _.isNil), // Only update fields that are not null or undefined
      updatedOn: now,
      updatedBy: null,
    })

  if (configurationData.disabledModules) {
    messageContext.bindActionCreators({
      calibrationDateUpdated,
    })

    for (const modules of configurationData.disabledModules) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(deviceIds.map(deviceId => shouldTriggerModuleDisabled(knex, messageContext, deviceId, modules)))
    }
  }

  if (configurationData.lastCalibrated) {
    await Promise.all(
      deviceIds.map(deviceId =>
        tryUpdateDeviceMaintenance(knex, deviceId, configurationData.lastCalibrated, messageContext)
      )
    )
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
    if (!messageContext.deviceModuleDisabled) {
      messageContext.bindActionCreators({ deviceModuleDisabled })
    }

    messageContext.deviceModuleDisabled(deviceId, deviceModule.SiteSerialNumber, deviceModule.Creation)
  }
}

module.exports = {
  updateDeviceConfiguration,
}
