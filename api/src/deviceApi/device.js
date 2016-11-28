const { knex, transact } = require('../db')
const { getExternalId } = require('./common')
const { addResult } = require('./result')

function* addDeviceData(context) {
  const response = {}
  const { payload } = context
  const { result, configuration, operation } = payload

  if (configuration) {
    response.configuration = yield* addDeviceConfiguration(
      Object.assign({}, context, { payload: configuration }))
  }

  if (operation) {
    response.operation = yield* addDeviceOperation(
      Object.assign({}, context, { payload: operation }))
  }

  if (result) {
    response.result = []
    for (const r of result) {
      const resultResponse = yield* addResult(
        Object.assign({}, context, { payload: r }))

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
  const { device: { id: deviceId } } = context

  const device = yield knex('Device as d')
    .where({ 'd.id': deviceId })
    .first('d.lastPingOn')

  return { lastPingOn: device.lastPingOn }
}

function* addDeviceConfiguration(context) {
  const { payload, device: { id: deviceId }, now } = context

  const externalId = getExternalId(payload.id)

  yield transact(function* (knex) {
    const [deviceConfigurationId] = yield knex('DeviceConfiguration')
      .insert({
        deviceId,
        externalId,
        data: JSON.stringify(payload.data),
        createdOn: now
      })

    yield knex('Device')
      .where('id', deviceId)
      .update({
        deviceConfigurationId,
        updatedOn: now
      })

    yield knex('DeviceLogUpdate').insert({
      deviceConfigurationId,
      deviceLogId: context.deviceLogId
    })
  })
  return { id: externalId }
}

function* addDeviceOperation(context) {
  const { payload, device: { id: deviceId }, now } = context

  const externalId = getExternalId(payload.id)

  yield transact(function* (knex) {
    const [deviceOperationId] = yield knex('DeviceOperation')
      .insert({
        deviceId,
        externalId,
        data: JSON.stringify(payload.data),
        createdOn: now
      })

    yield knex('Device')
      .where('id', deviceId)
      .update({
        deviceOperationId,
        updatedOn: now
      })

    yield knex('DeviceLogUpdate').insert({
      deviceOperationId,
      deviceLogId: context.deviceLogId
    })
  })
  return { id: externalId }
}

module.exports = {
  addDeviceData,
  getDeviceData,
  addDeviceConfiguration,
  addDeviceOperation
}
