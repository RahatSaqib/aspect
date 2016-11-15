const crypto = require('crypto')
const Boom = require('boom')
const { knex }  = require('../db')
const { getDeviceConstraints } = require('../auth/constraints')
const { asyncHandler } = require('../routes')

function getExternalId(candidateId){
  return typeof candidateId !== 'undefined'
      ? candidateId
      : crypto.randomBytes(48).toString('base64') // TODO UUID?
}

function deviceApiHandler(handler, {updatePing}){
  return asyncHandler(function*(request){
    const context = yield* getDeviceApiContext(request)
    const response = context.error || (yield* handler(context))

    if(updatePing && context.device && context.device.id){
      const now = new Date()
      yield knex('Device')
        .where({id: context.device.id})
        .update({
          updatedOn: now,
          lastPingOn: now,
          lastPingFromIp: context.remoteAddress
        })
    }
    return response
  })
}

function* getDeviceApiContext(request){
  const {auth} = request
  const devices = yield knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .where({
      'dak.id': +auth.credentials.dak,
      'dak.revoked': false
    })
    .select('d.id')

  if(devices.length !== 1){
    return {error: Boom.unauthorized()}
  }

  const constraints = yield getDeviceConstraints(auth.credentials)
  // TODO Does Hapi Remote address work through proxies? Check headers?
  const remoteAddress = request.info.remoteAddress || ''

  return {
    device: devices[0],
    constraints,
    payload: request.payload,
    query: request.query,
    remoteAddress
  }
}


module.exports = {
  getExternalId,
  deviceApiHandler
}
