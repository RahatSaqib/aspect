const Boom = require('boom')
const { transact } = require('../db')
const { getDeviceByApiKeyId, getExternalId } = require('./common')


function* addDeviceConfiguration(request) {
  const { payload } = request
  const device = yield* getDeviceByApiKeyId(request)
  if (!device.ok) {
    return Boom.unauthorized()
  }
  const deviceId = device.data.id

  const now = new Date()
  const externalId = getExternalId(payload.id)
  let ok = false

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

    ok = true
  })
  return ok ? { ok, data: { id: externalId } } : { ok }
}

function* addDeviceOperation(request) {
  const { payload } = request
  const device = yield* getDeviceByApiKeyId(request)

  const externalId = getExternalId(payload.id)
  let ok = false

  if (!device.ok) {
    return Boom.unauthorized()
  }
  const deviceId = device.data.id

  const now = new Date()

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

    ok = true
  })
  return ok ? { ok, data: { id: externalId } } : { ok }
}

module.exports = {
  addDeviceConfiguration,
  addDeviceOperation
}
