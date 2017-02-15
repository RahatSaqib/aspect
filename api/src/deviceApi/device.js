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

  const result = yield* getResult(context)
  if (result != null) {
    response.result = result
  }
  return response
}

function* updateDeviceConfiguration(context) {
  const { knex, payload, device: { id: deviceId } } = context

  const { previousConfigData } = yield knex('Device')
    .where({ id: deviceId })
    .first('configurationData as previousConfigData')

  const configurationData = previousConfigData == null ? payload.data :
    _.merge(JSON.parse(previousConfigData), payload.data)

  yield knex('Device')
    .where({ id: deviceId })
    .update({ configurationData: JSON.stringify(configurationData) })
  context.markDeviceConfigurationUpdated()

  return {}
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
