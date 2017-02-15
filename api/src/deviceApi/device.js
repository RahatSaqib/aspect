const _ = require('lodash')
const Boom = require('boom')
const { addConstraints } = require('../auth/constraints')
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
  const { now, device: { name: deviceName } } = context
  const response = { name: deviceName, time: now.toISOString() }

  const deviceLog = yield* getDeviceLog(context)
  if (deviceLog == null) {
    return Boom.notFound()
  }
  if (deviceLog.checkpoint != null) {
    response.checkpoint = deviceLog.checkpoint
  }

  const result = yield* getResult(context, deviceLog.id)
  if (result != null) {
    response.result = result
  }
  return response
}


function* getDeviceLog(context) {
  const { knex, device: { id: deviceId }, query, constraints: dataConstraints } = context

  // Find device log at checkpoint or latest
  const initialDeviceLogQuery = knex('DeviceLog')
    .where({ deviceId })
    .orderBy('id', 'desc')
  // use specified checkpoint, otherwise just select latest
  if (query.checkpoint) {
    initialDeviceLogQuery.where({ checkpoint: query.checkpoint })
  }
  const { checkpoint: initialCheckpoint, id: initialDeviceLogId } = (
    (yield initialDeviceLogQuery.first('checkpoint', 'id')) || {})
  const offset = +(query.offset || 0)
  if (!initialDeviceLogId) {
    //
    return null
  } else if (offset === 0) {
    // If no offset, return log at checkpoint for this device
    // as checkpoints are unique per device
    return {
      id: initialDeviceLogId,
      checkpoint: initialCheckpoint
    }
  }

  // We need to consider DeviceLogs with and without
  // the result constraints and return the first entry (minimum log id)
  // Two steps are required because results might be allowed from a
  // different sample origin site (lab/clinic) but device configuration
  // and operation updates are currently always constrained by device
  const deviceLogOffsetQuery = knex('Device as d')
    .innerJoin('DeviceLog as dl', 'dl.deviceId', 'd.id')
    .where({ 'd.id': deviceId })
    .union(function () {
      this.from('Result as r')
        .innerJoin('Device as d', 'r.deviceId', 'd.id')
        .innerJoin('DeviceLog as dl', 'dl.resultId', 'r.id')
        .leftJoin('Sample as s', 'r.sampleId', 's.id')
        .leftJoin('Site as sos', 's.originSiteId', 'sos.id')
        .modify(addConstraints, dataConstraints, { device: 'd', sample: 's' })
        .select('dl.id')
    })
    .select('dl.id')
    .as('dls')

  const deviceLogQuery = knex('DeviceLog as dl')
    .innerJoin(deviceLogOffsetQuery, 'dl.id', 'dls.id')
    .first(
      'dl.id as deviceLogId',
      'dl.deviceId as deviceLogDeviceId',
      'dl.checkpoint as deviceLogCheckpoint')
  if (offset > 0) {
    // select result after specified log entry
    deviceLogQuery
      .where('dl.id', '>', initialDeviceLogId)
      .orderBy('dl.id', 'asc')
    if (offset > 1) {
      // specify query offset if immediately after
      deviceLogQuery.offset(offset - 1)
    }
  } else if (offset < 0) {
    // select result before specified log entry
    deviceLogQuery
      .where('dl.id', '<', initialDeviceLogId)
      .orderBy('dl.id', 'desc')
    if (offset < -1) {
      // specify query offset if immediately before
      deviceLogQuery.offset(-offset - 1)
    }
  }

  const deviceLog = yield deviceLogQuery
  if (deviceLog == null) {
    return null
  }

  const { deviceLogId, deviceLogDeviceId, deviceLogCheckpoint } = deviceLog

  const response = { id: deviceLogId }
  // set checkpoint if log changed during query, e.g, due to offset
  // but do not leak checkpoint from different device
  if (deviceLogDeviceId === deviceId) {
    response.checkpoint = deviceLogCheckpoint
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
