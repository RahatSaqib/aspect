const Boom = require('boom')
const { transact } = require('../db')
const { getDeviceByApiKeyId } = require('./common')


function* addDeviceConfiguration(request){
  const {payload} = request
  const device = yield* getDeviceByApiKeyId(request)
  if(!device.ok){
    return Boom.unauthorized()
  }
  const deviceId = device.data.id

  const now = new Date()
  let deviceConfigurationId = -1

  yield transact(function*(knex){
    [deviceConfigurationId] = yield knex('DeviceConfiguration')
      .insert({
        deviceId,
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
  return deviceConfigurationId > 0
    ? {ok: true, data: {id: deviceConfigurationId}}
    : {ok: false}
}

function* addDeviceOperation(request){
  const {payload} = request
  const device = yield* getDeviceByApiKeyId(request)
  if(!device.ok){
    return Boom.unauthorized()
  }
  const deviceId = device.data.id

  const now = new Date()
  let deviceOperationId = -1

  yield transact(function*(knex){
    [deviceOperationId] = yield knex('DeviceOperation')
      .insert({
        deviceId,
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
  return deviceOperationId > 0
    ? {ok: true, data: {id: deviceOperationId}}
    : {ok: false}
}

module.exports = {
  addDeviceConfiguration,
  addDeviceOperation
}
