const crypto = require('crypto')
const Boom = require('boom')
const { knex } = require('../db')
const { getDeviceConstraints } = require('../auth/constraints')
const { asyncHandler } = require('../routes')

function getExternalId(candidateId) {
  return typeof candidateId !== 'undefined'
      ? candidateId
      : crypto.randomBytes(48).toString('base64') // TODO UUID?
}

function deviceApiHandler(handler, { updatePing, updateDeviceLog }) {
  return asyncHandler(function* (request) {
    const context = yield* getDeviceApiContext(request)
    if (context.error) {
      // unauthorized, record nothing
      return context.error
    }

    const { device, now } = context

    if (device && device.id) {
      // TODO Does Hapi Remote address work through proxies? Check headers?
      const remoteAddress = request.info.remoteAddress || ''

      if (updateDeviceLog) {
        const [deviceLogId] = yield knex('DeviceLog').insert({
          deviceId: device.id,
          source: 'DeviceAPI',
          createdOn: now,
          senderIp: remoteAddress,
          // TODO DeviceLog handle non-JSON payloads
          rawMessage: JSON.stringify(request.plugins.rawPayload)
        })
        context.deviceLogId = deviceLogId
      }

      if (updatePing) {
        yield knex('Device')
          .where({ id: device.id })
          .update({
            lastPingOn: now,
            lastPingFromIp: remoteAddress
          })
      }
    }

    return yield* handler(context)
  })
}

function* getDeviceApiContext(request) {
  const { auth } = request
  const now = new Date()
  const devices = yield knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .where({
      'dak.id': +auth.credentials.dak,
      'dak.revoked': false
    })
    .select('d.id')

  if (devices.length !== 1) {
    return { error: Boom.unauthorized() }
  }

  const constraints = yield getDeviceConstraints(auth.credentials)

  return {
    now,
    device: devices[0],
    constraints,
    payload: request.payload,
    query: request.query
  }
}


module.exports = {
  getExternalId,
  deviceApiHandler
}
