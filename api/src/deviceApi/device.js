const Promise = require('bluebird')
const { getExternalId } = require('./common')
const { addResult } = require('./result')

function* addDeviceData(context) {
  const response = {}
  const { payload } = context
  const { result, configuration, operation } = payload

  if (configuration) {
    response.configuration = yield* addDeviceConfiguration(
      context.withPayload(configuration))
  }

  if (operation) {
    response.operation = yield* addDeviceOperation(
      context.withPayload(operation))
  }

  if (result) {
    response.result = []
    for (const r of result) {
      const resultResponse = yield* addResult(
        context.withPayload(r))

      if (resultResponse instanceof Error) {
        // TODO formalize error handling
        return response.result
      }
      // Only keep report last updated in response
      response.result = resultResponse
    }
  }


  return response
}

function* getDeviceData(context) {
  const { knex, device: { id: deviceId } } = context

  const deviceQ = knex('Device')
    .where({ id: deviceId })
    .first('lastPingOn')

  const deviceLogQ = knex('DeviceLog')
    .where({ deviceId })
    .orderBy('id', 'desc')
    .first('checkpoint')

  const [device, deviceLog] = yield Promise.all([deviceQ, deviceLogQ])

  const lastPingOn = device.lastPingOn
  const checkpoint = deviceLog ? deviceLog.checkpoint : null

  return { lastPingOn, checkpoint }
}

function* addDeviceConfiguration(context) {
  const { knex, payload, device: { id: deviceId }, now } = context

  const externalId = getExternalId(payload.id)

  const [deviceConfigurationId] = yield knex('DeviceConfiguration')
    .insert({
      deviceId,
      externalId,
      data: JSON.stringify(payload.data),
      createdOn: now
    })
  context.addDeviceConfigurationId(deviceConfigurationId)

  yield knex('Device')
    .where('id', deviceId)
    .update({ deviceConfigurationId })

  return { id: externalId }
}

function* addDeviceOperation(context) {
  const { knex, payload, device: { id: deviceId }, now } = context

  const externalId = getExternalId(payload.id)

  const [deviceOperationId] = yield knex('DeviceOperation')
    .insert({
      deviceId,
      externalId,
      data: JSON.stringify(payload.data),
      createdOn: now
    })
  context.addDeviceOperationId(deviceOperationId)

  yield knex('Device')
    .where('id', deviceId)
    .update({ deviceOperationId })

  return { id: externalId }
}

module.exports = {
  addDeviceData,
  getDeviceData,
  addDeviceConfiguration,
  addDeviceOperation
}
