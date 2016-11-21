const { knex, transact } = require('../db')
const { addConstraints } = require('../auth/constraints')
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
  const { device: { id: deviceId }, constraints: dataConstraints } = context

  const lastDeviceQ = knex('Device as d')
    .where({ 'd.id': deviceId })
    .first('d.updatedOn', 'd.lastPingOn')

  const lastResultQ = knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .modify(addConstraints, dataConstraints, { device: 'd', sample: 's' })
    .orderBy('updatedOn', 'desc')
    .first('r.externalId as id', 'r.updatedOn as updatedOn')

  const lastConfigQ = knex('DeviceConfiguration as c')
    .innerJoin('Device as d', 'c.id', 'd.deviceConfigurationId')
    .where({ 'd.id': deviceId })
    .first('c.externalId as id', 'c.createdOn as updatedOn')

  const lastOpQ = knex('DeviceOperation as o')
    .innerJoin('Device as d', 'o.id', 'd.deviceOperationId')
    .where({ 'd.id': deviceId })
    .first('o.externalId as id', 'o.createdOn as updatedOn')

  const [lastDevice, lastResult, lastConfig, lastOp] = yield Promise.all([
    lastDeviceQ, lastResultQ, lastConfigQ, lastOpQ])

  const response = { updatedOn: lastDevice.updatedOn, lastPingOn: lastDevice.lastPingOn }
  if (lastResult) {
    response.result = { id: lastResult.id, updatedOn: lastResult.updatedOn.toISOString() }
  }
  if (lastConfig) {
    response.configuration = { id: lastConfig.id, updatedOn: lastConfig.updatedOn.toISOString() }
  }
  if (lastOp) {
    response.operation = { id: lastOp.id, updatedOn: lastOp.updatedOn.toISOString() }
  }

  return response
}

function* addDeviceConfiguration(context) {
  const { payload, device: { id: deviceId } } = context

  const now = new Date()
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
  })
  return { id: externalId, updatedOn: now.toISOString() }
}

function* addDeviceOperation(context) {
  const { payload, device: { id: deviceId } } = context

  const now = new Date()
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
  })
  return { id: externalId, updatedOn: now.toISOString() }
}

module.exports = {
  addDeviceData,
  getDeviceData,
  addDeviceConfiguration,
  addDeviceOperation
}
