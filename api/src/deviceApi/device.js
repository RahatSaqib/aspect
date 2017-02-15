const _ = require('lodash')
const { addResult, getResult } = require('./result')

function* addDeviceData(context) {
  const response = {}
  const { knex, now, payload, device: { id: deviceId } } = context
  const { name, result, configuration, operation } = payload

  if (name) {
    yield knex('Device')
      .where({ id: deviceId })
      .update({ name, updatedOn: now })
  }

  if (configuration) {
    yield* updateDeviceConfiguration(
      context.withPayload(configuration))
  }

  if (operation) {
    yield* addDeviceOperation(
      context.withPayload(operation))
  }

  if (result) {
    const resultResponse = yield* addResult(
      context.withPayload(result))

    if (resultResponse instanceof Error) {
      // TODO formalize error handling
      return resultResponse
    }
  }

  return response
}

function* getDeviceData(context) {
  const { now, device: { name: deviceName }, deviceLog: { checkpoint } } = context

  const response = { name: deviceName, time: now.toISOString() }
  if (checkpoint != null) {
    response.checkpoint = checkpoint
  }

  const config = yield* getDeviceConfiguration(context, true)
  if (config != null) {
    response.configuration = config
  }
  const result = yield* getResult(context)
  if (result != null) {
    response.result = result
  }
  return response
}

function* updateDeviceConfiguration(context) {
  const { knex, payload, device: { id: deviceId } } = context

  const previousConfig = yield* getDeviceConfiguration(context)
  const configurationData = previousConfig == null ? payload.data :
    _.merge(previousConfig.data, payload.data)

  yield knex('Device')
    .where({ id: deviceId })
    .update({ configurationData: JSON.stringify(configurationData) })
  context.markDeviceConfigurationUpdated()

  return {}
}

function* getDeviceConfiguration(context, requireUpdated = false) {
  const { knex, device: { id: deviceId } } = context
  const deviceQuery = knex('Device as d')
    .first('d.configurationData')
  if (requireUpdated) {
    deviceQuery
      .innerJoin('DeviceLog as dl', 'dl.deviceId', 'd.id')
      .where({
        'dl.id': context.deviceLog.id,
        'dl.deviceConfigurationUpdated': true
      })
  } else {
    deviceQuery
      .where({ id: deviceId })
  }

  const device = yield deviceQuery
  if (device == null || device.configurationData == null) {
    return null
  }
  return { data: JSON.parse(device.configurationData) }
}

function* addDeviceOperation(context) {
  const { knex, payload, device: { id: deviceId }, now } = context

  const [deviceOperationId] = yield knex('DeviceOperation')
    .insert({
      deviceId,
      externalId: payload.id,
      data: JSON.stringify(payload.data),
      startedOn: payload.startedOn,
      endedOn: payload.endedOn,
      createdOn: now
    })
  context.addDeviceOperationId(deviceOperationId)

  return {}
}

module.exports = {
  addDeviceData,
  getDeviceData,
  updateDeviceConfiguration,
  addDeviceOperation
}
