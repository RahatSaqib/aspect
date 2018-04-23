const Boom = require('boom')
const _ = require('lodash')

async function updateDeviceConfiguration(knex, deviceId, payload, now) {
  const previousConfig = await getDeviceConfiguration(knex, deviceId)
  const configurationData =
    previousConfig == null
      ? payload.data
      : _.merge(previousConfig.data, _.omitBy(payload.data, _.isNull))

  await knex('Device')
    .where({ id: deviceId })
    .update({
      configurationData: JSON.stringify(configurationData),
      updatedBy: null,
      updatedOn: now,
    })

  return {}
}

async function updateDeviceDetails(knex, deviceId, deviceDetails, now) {
  if (deviceId) {
    // Compare existing device to these details
    // which field vakues are different?
    const existingDevice = await knex('Device as d')
      .where({ 'd.id': deviceId })
      .select()
    const changedDetails = _.omitBy(
      deviceDetails,
      (v, k) =>
        ['id', 'createdOn', 'createdBy'].includes(k) || existingDevice[k] == v // eslint-disable-line eqeqeq
    )
    if (!_.isEmpty(changedDetails)) {
      await knex('Device')
        .where({ id: deviceId })
        .update(
          _.merge(changedDetails, {
            updatedBy: null,
            updatedOn: now,
          })
        )
    }
  }
  return knex('Device as d')
    .where({ 'd.id': deviceId })
    .first()
}

async function getDeviceConfiguration(knex, deviceId) {
  const deviceQuery = knex('Device as d')
    .first('d.configurationData')
    .where({ id: deviceId })
  const deviceConfiguration = await getDeviceConfigurationFromQuery(deviceQuery)
  return deviceConfiguration
}

async function getDeviceConfigurationFromDeviceLog(knex, deviceLogId) {
  const deviceQuery = knex('Device as d').first('d.configurationData')
  deviceQuery.innerJoin('DeviceLog as dl', 'dl.deviceId', 'd.id').where({
    'dl.id': deviceLogId,
    'dl.deviceConfigurationUpdated': true,
  })
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
    status,
    shortName,
    macAddress,
    hostId,
    culture,
    timezone,
    configurationData = '{}',
    putInService,
    lastSeenOn,
  }
) {
  const deviceType = await knex('DeviceType')
    .where({ externalId: deviceTypeExternalId })
    .first('id', 'name', 'plugin')
  if (deviceType == null) {
    return {
      error: Boom.badRequest(
        `Cannot find DeviceType with id ${deviceTypeExternalId}`
      ),
    }
  }

  // Use or generate device name
  if (!name) {
    if (serial) {
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
  const [deviceId] = await knex('Device').insert({
    partnerId,
    geographyId,
    siteId,
    deviceTypeId: deviceType.id,
    deviceStatusId: knex('DeviceStatus')
      .where({ token: status })
      .select('id'),
    name,
    serial,
    shortName,
    macAddress,
    hostId,
    culture,
    timezone,
    configurationData,
    putInService: putInService || now,
    lastSeenOn: lastSeenOn || now,
    createdOn: now,
    updatedOn: now,
  })
  await knex('DeviceStatusLog').insert({
    deviceId,
    deviceStatusId: knex('DeviceStatus')
      .where({ token: status })
      .select('id'),
    changedOn: now,
    createdOn: now,
    createdBy: null,
  })

  // add device into FactDeviceFlag
  await knex('FactDeviceFlag').insert({ deviceId, updatedOn: now })
  const device = await knex('Device as d')
    .join('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .where('d.id', deviceId)
    .first(
      'd.id',
      'd.partnerId',
      'd.siteId',
      'd.name',
      'd.serial',
      'd.lastSeenOn',
      'ds.token as status',
      'dt.externalId as deviceType',
      'dt.plugin as deviceTypePluginName'
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
