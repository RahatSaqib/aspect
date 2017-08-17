const _ = require('lodash')

function* updateDeviceConfiguration(knex, deviceId, payload) {
  const previousConfig = yield* getDeviceConfiguration(knex, deviceId)
  const configurationData =
    previousConfig == null
      ? payload.data
      : _.merge(previousConfig.data, payload.data)

  yield knex('Device')
    .where({ id: deviceId })
    .update({ configurationData: JSON.stringify(configurationData) })

  return {}
}

function* getDeviceConfiguration(knex, deviceId) {
  const deviceQuery = knex('Device as d')
    .first('d.configurationData')
    .where({ id: deviceId })
  return yield* getDeviceConfigurationFromQuery(deviceQuery)
}

function* getDeviceConfigurationFromDeviceLog(knex, deviceLogId) {
  const deviceQuery = knex('Device as d').first('d.configurationData')
  deviceQuery.innerJoin('DeviceLog as dl', 'dl.deviceId', 'd.id').where({
    'dl.id': deviceLogId,
    'dl.deviceConfigurationUpdated': true,
  })
  return yield* getDeviceConfigurationFromQuery(deviceQuery)
}

function* getDeviceConfigurationFromQuery(deviceQuery) {
  const device = yield deviceQuery
  if (device == null || device.configurationData == null) {
    return null
  }
  return { data: JSON.parse(device.configurationData) }
}

function* addDeviceOperation(knex, deviceId, payload, now = new Date()) {
  const [deviceOperationId] = yield knex('DeviceOperation').insert({
    deviceId,
    externalId: payload.id,
    data: JSON.stringify(payload.data),
    startedOn: payload.startedOn,
    endedOn: payload.endedOn,
    createdOn: now,
  })
  return { id: deviceOperationId }
}

function* getDeviceOperation(knex, deviceLogId) {
  const op = yield knex('DeviceOperation as do')
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

function* getSite(knex, deviceId) {
  const site = yield knex('Site as s')
    .innerJoin('Device as d', 'd.siteId', 's.id')
    .where('d.id', deviceId)
    .first('s.externalId')
  return site == null ? null : { id: site.externalId }
}

module.exports = {
  updateDeviceConfiguration,
  getDeviceConfiguration,
  getDeviceConfigurationFromDeviceLog,
  getDeviceOperation,
  addDeviceOperation,
  getSite,
}
