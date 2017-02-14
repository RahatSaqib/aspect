const _ = require('lodash')
const Boom = require('boom')
const { addResult, getResultAndDeviceLog } = require('./result')

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
  const { now, knex, device: { id: deviceId, name: deviceName }, query } = context
  const response = { name: deviceName, time: now.toISOString() }

  const deviceLogQ = knex('DeviceLog')
    .where({ deviceId })
    .orderBy('id', 'desc')
  // use specified checkpoint, otherwise just select latest
  if (query.checkpoint) {
    deviceLogQ.where({ checkpoint: query.checkpoint })
  }
  const { checkpoint, id: deviceLogId } = (
    (yield deviceLogQ.first('checkpoint', 'id')) || {})
  const offset = +(query.offset || 0)

  // TODO include configuration and operation at checkpoint
  // once we do this, we need to consider DeviceLogs without
  // the result constraints and return the first entry (minimum log id)
  // Two steps are required because results might be allowed from a
  // different sample origin site (lab/clinic) but device configuration
  // and operation updates are currently always constrained by device
  // We also need to make sure to adjust the offset passed to the getResult
  // query accordingly to skip device configuration and operation logs
  const { result, deviceLog: resultDeviceLog } = yield* getResultAndDeviceLog(
    context, deviceLogId, offset)
  if (result != null) {
    response.result = result

    // set actual checkpoint if log changed during query, e.g, due to offset
    // but do not leak checkpoint from different device
    if (resultDeviceLog.deviceId === deviceId) {
      response.checkpoint = resultDeviceLog.checkpoint
    }
  } else if (deviceLogId != null && offset === 0) {
    // set checkpoint if one found even if we couldn't find result
    response.checkpoint = checkpoint
  } else {
    // cannot find specified checkpoint with offset
    return Boom.notFound()
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
