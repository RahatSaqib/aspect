const Boom = require('@hapi/boom')
const _ = require('lodash')
const uuid = require('node-uuid')
const { deviceApprovalToId, deviceMaintenanceTypeToId } = require('../shared/dictionary')
const { parseDateOrDefault } = require('../shared/date')
const { setDeviceCalibrationStatus } = require('../plugin/utils')
const { calibrationDateUpdated } = require('../device/actions')
const { getCreateAssignPerson } = require('../person/common/db')

async function updateDeviceConfiguration(knex, deviceId, payload, now, messageContext) {
  const previousConfig = await getDeviceConfiguration(knex, deviceId)
  const configurationData =
    previousConfig == null ? payload.data : _.merge(previousConfig.data, _.omitBy(payload.data, _.isNull))

  // process prop 'lastCalibrated' in 'payload', if any defined
  await tryUpdateDeviceMaintenance(knex, deviceId, payload, messageContext)

  // process props labContact* and installer* in 'payload', if any defined
  await tryAssignLabTechnicianToSite(knex, deviceId, payload)
  // finally update Device.configurationData
  await knex('Device')
    .where({ id: deviceId })
    .update({
      configurationData: JSON.stringify(configurationData),
      updatedBy: null,
      updatedOn: now,
    })

  return {}
}

// --------------------------------------------------------------------
async function tryUpdateDeviceMaintenance(knex, deviceId, payload, messageContext) {
  const {
    data: { lastCalibrated },
  } = payload
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

// --------------------------------------------------------------------
async function tryAssignLabTechnicianToSite(knex, deviceId, payload) {
  const {
    data: {
      timezone,
      culture,
      labContactCell,
      labContactEmail,
      labContactName,
      installerCell,
      installerEmail,
      installerName,
    },
  } = payload
  if (labContactName || labContactEmail || installerName || installerEmail) {
    // get device props
    const device = await knex('Device as d')
      .join('Site as s', 'd.siteId', 's.id')
      .join('Geography as g', 's.geographyId', 'g.id')
      .where('d.id', deviceId)
      .first('g.countryId', 's.id as siteId', 'd.partnerId', 's.geographyId')
    const { countryId, partnerId, geographyId, siteId } = device || {}
    // throw error if no device found or it is not assigned to site
    if (!device || !siteId) {
      return Boom.notFound()
    }

    const baseProps = {
      countryId,
      partnerId,
      geographyId,
      siteId,
      timezone,
      culture,
    }
    await getCreateAssignPerson(knex, {
      ...baseProps,
      name: labContactName,
      email: labContactEmail,
      cell: labContactCell,
      jobFunctionExternalId: 'labUser',
    })

    await getCreateAssignPerson(knex, {
      ...baseProps,
      name: installerName,
      email: installerEmail,
      cell: installerCell,
      jobFunctionExternalId: 'technician',
    })
  }
}

// --------------------------------------------------------------------
async function updateDeviceDetails(knex, deviceId, deviceDetails, now, isFastImport) {
  // Compare existing device to these details
  // which field vakues are different?
  const existingDevice = await knex('Device as d').where({ 'd.id': deviceId }).first()
  /* validates if the tz is included in our db */
  if (deviceDetails.timezone && existingDevice.timezone !== deviceDetails.timezone) {
    const { timeZone: defaultTimeZone } =
      (await knex('Site as s')
        .join('Geography as g', 's.geographyId', 'g.id')
        .join('Country as c', 'g.countryId', 'c.id')
        .where('s.id', existingDevice.siteId)
        .first(knex.raw('COALESCE(s.timezoneId, c.timezone) as timeZone'))) ||
      (await knex('Country as c').first('c.timezone as timeZone'))
    const { existingTimeZone } = (await knex('TimeZone')
      .where('id', deviceDetails.timezone)
      .first('id as existingTimeZone')) || {
      existingTimeZone: defaultTimeZone,
    }

    deviceDetails.timezone = existingTimeZone
  }
  const changedDetails = _.omitBy(
    deviceDetails,
    (v, k) => ['id', 'createdOn', 'createdBy'].includes(k) || existingDevice[k] == v // eslint-disable-line eqeqeq
  )
  if (!_.isEmpty(changedDetails) && !isFastImport) {
    await knex('Device')
      .where({ id: deviceId })
      .update(
        _.merge({}, changedDetails, {
          updatedBy: null,
          updatedOn: now,
        })
      )
  }
}

async function getDeviceConfiguration(knex, deviceId) {
  const deviceQuery = knex('Device as d').first('d.configurationData').where({ id: deviceId })
  const deviceConfiguration = await getDeviceConfigurationFromQuery(deviceQuery)
  return deviceConfiguration
}

async function getDeviceConfigurationFromQuery(deviceQuery) {
  const device = await deviceQuery
  if (device == null || device.configurationData == null) {
    return null
  }
  // Exclude 'latestErrors' from 'configurationData' in the response to reduce network data usage
  return { data: _.omit(JSON.parse(device.configurationData), ['latestErrors']) }
}

async function addDeviceOperation(knex, deviceId, payload, now = new Date()) {
  const [deviceOperationId] = await knex('DeviceOperation').insert({
    deviceId,
    externalId: payload.id,
    data: JSON.stringify(payload.data),
    startedOn: payload.startedOn,
    endedOn: payload.endedOn,
    createdOn: now,
    hash: payload.hash,
    guid: uuid.v4(),
  })
  return { id: deviceOperationId }
}

async function createNewDevice(
  knex,
  now,
  {
    deviceTypeExternalId,
    name,
    serial,
    partnerId,
    siteId,
    approval,
    shortName,
    macAddress,
    hostId,
    culture,
    timezone,
    configurationData = '{}',
    putInService,
    lastSeenOn,
    lastPingOn,
  }
) {
  const deviceType = await knex('DeviceType')
    .where({ externalId: deviceTypeExternalId })
    .first('id', 'name', 'plugin', 'externalId')
  if (deviceType == null) {
    return {
      error: Boom.badRequest(`Cannot find DeviceType with id ${deviceTypeExternalId}`),
    }
  }

  const { timeZone: defaultTimeZone } =
    (await knex('Site as s')
      .join('Geography as g', 's.geographyId', 'g.id')
      .join('Country as c', 'c.id', 'g.countryId')
      .where('s.id', siteId)
      .first(knex.raw('COALESCE(s.timezoneId, c.timezone) as timeZone'))) ||
    (await knex('Country as c').first('c.timezone as timeZone'))
  const { existingTimeZone } = await knex('TimeZone')
    .where('id', timezone || defaultTimeZone)
    .first('id as existingTimeZone')

  // Use or generate device name
  if (!name) {
    if (shortName) {
      name = shortName
    } else if (serial) {
      name = serial
    } else {
      const [deviceCount] = await knex('Device')
        .where({
          partnerId,
          deviceTypeId: deviceType.id,
        })
        .count('id as cnt')
      name = `${deviceType.name} #${deviceCount.cnt + 1}`
    }
  }
  if (!shortName && name) {
    shortName = name
  }
  const deviceApprovalId = await deviceApprovalToId(approval)
  if (shortName && shortName.length > 45) {
    shortName = shortName.substr(0, 45)
  }

  const partnerData = await knex('Partner').where({ id: partnerId }).first('deviceCapacityFactor')

  const [deviceId] = await knex('Device').insert({
    partnerId,
    siteId,
    deviceTypeId: deviceType.id,
    dailyTestCapacity: deviceType.externalId === 'CepheidGeneXpert' ? partnerData.deviceCapacityFactor * 4 : null, // for CepheidGeneXpert we are using module=4
    moduleBayCapacity: deviceType.externalId === 'CepheidGeneXpert' ? 4 : 0,
    deviceApprovalId,
    name,
    serial,
    shortName,
    macAddress,
    hostId,
    culture,
    timezone: existingTimeZone,
    configurationData,
    putInService,
    lastSeenOn,
    lastPingOn,
    createdOn: now,
    updatedOn: now,
  })
  await knex('DeviceApprovalLog').insert({
    deviceId,
    deviceApprovalId,
    changedOn: now,
    createdOn: now,
    createdBy: null,
  })
  const device = await knex('Device as d')
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .join('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
    .leftJoin('Partner as p', 'd.partnerId', 'p.id')
    .where('d.id', deviceId)
    .first(
      'd.id',
      'd.partnerId',
      'd.siteId',
      's.geographyId',
      'd.name',
      'd.shortName',
      'd.serial',
      'd.macAddress',
      'd.configurationData',
      'd.connectSettingsSentOn',
      'd.lastSeenOn',
      'd.putInService',
      'da.token as approval',
      'dt.externalId as deviceType',
      'dt.plugin as deviceTypePluginName',
      'p.plugin as partnerPluginName',
      'dtc.name as deviceTypeCategory'
    )
  return { device }
}

module.exports = {
  updateDeviceConfiguration,
  updateDeviceDetails,
  getDeviceConfiguration,
  addDeviceOperation,
  createNewDevice,
}
