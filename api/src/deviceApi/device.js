const { addResult, listResults } = require('./result')

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
  const { knex, device: { id: deviceId }, query } = context

  const deviceLogQ = knex('DeviceLog')
    .where({ deviceId })
    .orderBy('id', 'desc')
  // use specified checkpoint, otherwise just select latest
  if (query.checkpoint) {
    deviceLogQ.where({ checkpoint: query.checkpoint })
  }
  const { checkpoint, id: deviceLogId } = (
    (yield deviceLogQ.first('checkpoint', 'id')) || {})

  const result = yield* listResults(context, deviceLogId)
  // TODO include configuration and operation at checkpoint

  return { checkpoint, result }
}

function* addDeviceConfiguration(context) {
  const { knex, payload, device: { id: deviceId }, now } = context

  const [deviceConfigurationId] = yield knex('DeviceConfiguration')
    .insert({
      deviceId,
      externalId: payload.id,
      data: JSON.stringify(payload.data),
      createdOn: now
    })
  context.addDeviceConfigurationId(deviceConfigurationId)

  yield knex('Device')
    .where('id', deviceId)
    .update({ deviceConfigurationId })

  return {}
}

function* addDeviceOperation(context) {
  const { knex, payload, device: { id: deviceId }, now } = context

  const [deviceOperationId] = yield knex('DeviceOperation')
    .insert({
      deviceId,
      externalId: payload.id,
      data: JSON.stringify(payload.data),
      createdOn: now
    })
  context.addDeviceOperationId(deviceOperationId)

  yield knex('Device')
    .where('id', deviceId)
    .update({ deviceOperationId })

  return {}
}

module.exports = {
  addDeviceData,
  getDeviceData,
  addDeviceConfiguration,
  addDeviceOperation
}
