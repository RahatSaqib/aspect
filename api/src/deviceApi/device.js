const Boom = require('@hapi/boom')
const _ = require('lodash')
const { deviceApprovalToId, deviceMaintenanceTypeToId } = require('../shared/dictionary')
const { parseDateOrDefault } = require('../shared/date')
const { getPeopleBase } = require('../shared/utilsPerson')
const { setDeviceCalibrationStatus } = require('../plugin/utils')
const { calibrationDateUpdated } = require('../device/actions')

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
      .join('Geography as g', 'd.geographyId', 'g.id')
      .join('Site as s', 'd.siteId', 's.id')
      .where('d.id', deviceId)
      .first('g.countryId', 's.id as siteId', 'd.partnerId', 'd.geographyId')
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
const getCreateAssignPerson = async (
  knex,
  { countryId, partnerId, geographyId, siteId, name, email, cell, timezone, culture, jobFunctionExternalId }
) => {
  const personQuery = getPeopleBase()
    .where('g.countryId', countryId)
    .groupBy('p.id')
    .first('p.name', 'p.id', 'p.email', 'p.email2', 'p.cell', 'j.id as jobId')
  //
  const personByName = await personQuery.where('p.name', name)
  const personByEmail = await personQuery.where(builder => {
    builder.where('p.email', email).orWhere('p.email2', email)
  })

  let jobId
  let personId
  // ----------
  // person-by-name found
  // ----------
  if (personByName) {
    personId = personByName.id
    ;[{ jobId }] = [personByName]
    // update email if it's missing
    if (email && !personByName.email) {
      await knex('Person').update('email', email).where('id', personId)
    }
    // update cell if it's missing
    if (cell && !personByName.cell) {
      await knex('Person').update('cell', cell).where('id', personId)
    }
  }
  // ----------
  // or person-by-email found
  // ----------
  else if (personByEmail) {
    personId = personByEmail.id
    ;[{ jobId }] = [personByEmail]
    // update cell if it's missing
    if (cell && !personByEmail.cell) {
      await knex('Person').update('cell', cell).where('id', personId)
    }
  }
  // ----------
  // or create person with specified name
  // ----------
  else if (name) {
    /* validates if the tz is included in our db */
    const { timeZone: defaultTimeZone } =
      (await knex('Geography as g')
        .join('Country as c', 'c.id', 'g.countryId')
        .where('g.id', geographyId)
        .first('c.timezone as timeZone')) || (await knex('Country as c').first('c.timezone as timeZone'))
    const { existingTimeZone } = (await knex('TimeZone').where('id', timezone).first('id as existingTimeZone')) || {}
    timezone = existingTimeZone || defaultTimeZone
    ;[personId] = await knex('Person').insert({
      geographyId,
      name: name || null,
      email: email || null,
      cell: cell || null,
      lastPartnerId: partnerId,
      lastCountryId: countryId,
      timezone,
      culture,
      createdOn: new Date(),
      updatedOn: new Date(),
      partnerId,
    })
  }

  /**
   * for this person -
   * - check/create job for 'Lab User' or 'Technician'
   * - assign this person to site, i.e. to JobContext
   */
  if (personId) {
    // create Job for person
    if (!jobId) {
      const jobFunction = await knex('JobFunction').where({ externalId: jobFunctionExternalId }).first('id')
      if (!jobFunction) {
        throw Boom.expectationFailed(`Required job function '${jobFunctionExternalId}' is missing`)
      }

      ;[jobId] = await knex('Job').insert({
        personId,
        jobFunctionId: jobFunction.id,
      })
    }

    // assign contact to site if it is not assigned yet
    const newJobContext = { jobId, siteId }
    const existingJobContext = await knex('JobContext')
      .where(newJobContext)
      .whereNull('assayTypeId')
      .whereNull('assayId')
      .whereNull('deviceTypeId')
      .whereNull('diseaseId')
      .first()
    if (!existingJobContext) {
      await knex('JobContext').insert(newJobContext)
    }
  }

  return personId
}

// --------------------------------------------------------------------
async function updateDeviceDetails(knex, deviceId, deviceDetails, now) {
  if (deviceId) {
    // Compare existing device to these details
    // which field vakues are different?
    const existingDevice = await knex('Device as d').where({ 'd.id': deviceId }).first()
    /* validates if the tz is included in our db */
    if (deviceDetails.timezone && existingDevice.timezone !== deviceDetails.timezone) {
      const { timeZone: defaultTimeZone } =
        (await knex('Site as s')
          .join('Geography as g', 's.geographyId', 'g.id')
          .join('Country as c', 'c.id', 'g.countryId')
          .where('g.id', existingDevice.geographyId)
          .orWhere('s.id', existingDevice.siteId)
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
    if (!_.isEmpty(changedDetails)) {
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
  return knex('Device as d').where({ 'd.id': deviceId }).first()
}

async function getDeviceConfiguration(knex, deviceId) {
  const deviceQuery = knex('Device as d').first('d.configurationData').where({ id: deviceId })
  const deviceConfiguration = await getDeviceConfigurationFromQuery(deviceQuery)
  return deviceConfiguration
}

async function getDeviceConfigurationFromDeviceLog(knex, deviceLogId) {
  const deviceQuery = knex('Device as d')
    .innerJoin('DeviceLog as dl', 'dl.deviceId', 'd.id')
    .where({
      'dl.id': deviceLogId,
      'dl.deviceConfigurationUpdated': true,
    })
    .first('d.configurationData')
  const deviceConfiguration = await getDeviceConfigurationFromQuery(deviceQuery)
  return deviceConfiguration
}

async function getDeviceConfigurationFromQuery(deviceQuery) {
  const device = await deviceQuery
  if (device == null || device.configurationData == null) {
    return null
  }
  return { data: JSON.parse(device.configurationData) }
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
  })
  return { id: deviceOperationId }
}

async function getDeviceOperation(knex, deviceLogId) {
  const op = await knex('DeviceOperation as do')
    .innerJoin('DeviceLog as dl', 'dl.deviceOperationId', 'do.id')
    .where({
      'dl.id': deviceLogId,
    })
    .first('externalId as id', 'data', 'startedOn', 'endedOn')
  if (op == null) {
    return null
  }

  const result = {}
  if (op.id != null) {
    result.id = op.id
  }
  if (op.data != null) {
    result.data = JSON.parse(op.data)
  }
  if (op.startedOn != null) {
    result.startedOn = op.startedOn.toISOString()
  }
  if (op.endedOn != null) {
    result.endedOn = op.endedOn.toISOString()
  }
  return result
}

async function getSite(knex, deviceId) {
  const site = await knex('Site as s')
    .innerJoin('Device as d', 'd.siteId', 's.id')
    .where('d.id', deviceId)
    .first('s.externalId')
  return site == null ? null : { id: site.externalId }
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
    geographyId,
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
  const deviceType = await knex('DeviceType').where({ externalId: deviceTypeExternalId }).first('id', 'name', 'plugin')
  if (deviceType == null) {
    return {
      error: Boom.badRequest(`Cannot find DeviceType with id ${deviceTypeExternalId}`),
    }
  }

  const { timeZone: defaultTimeZone } =
    (await knex('Site as s')
      .join('Geography as g', 's.geographyId', 'g.id')
      .join('Country as c', 'c.id', 'g.countryId')
      .where('g.id', geographyId)
      .orWhere('s.id', siteId)
      .first(knex.raw('COALESCE(s.timezoneId, c.timezone) as timeZone'))) ||
    (await knex('Country as c').first('c.timezone as timeZone'))
  const { existingTimeZone } = await knex('TimeZone')
    .where('id', timezone || defaultTimeZone)
    .first('id as existingTimeZone')

  const deviceCapacity = await knex('DeviceCapacity')
    .where({ deviceTypeId: deviceType.id })
    .where({ partnerId })
    .where({ defaultForDeviceType: 1 })
    .first('id')

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
  const [deviceId] = await knex('Device').insert({
    partnerId,
    geographyId,
    siteId,
    deviceTypeId: deviceType.id,
    deviceCapacityId: deviceCapacity ? deviceCapacity.id : null,
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
    .join('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
    .leftJoin('Partner as p', 'd.partnerId', 'p.id')
    .where('d.id', deviceId)
    .first(
      'd.id',
      'd.partnerId',
      'd.siteId',
      'd.geographyId',
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
  getDeviceConfigurationFromDeviceLog,
  getDeviceOperation,
  addDeviceOperation,
  getSite,
  createNewDevice,
}
