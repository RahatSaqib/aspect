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
    // TODO Does Hapi Remote address work through proxies? Check headers?
    const remoteAddress = request.info.remoteAddress || ''

    // Insert Device Log and Update Ping prior to calling handler so
    // it is recorded even if handler fails
    let deviceLogId = null
    if (updateDeviceLog) {
      [deviceLogId] = yield knex('DeviceLog').insert({
        deviceId: device.id,
        source: 'DeviceAPI',
        checkpoint: request.payload && request.payload.checkpoint,
        createdOn: now,
        senderIp: remoteAddress,
        // TODO DeviceLog handle non-JSON payloads
        rawMessage: JSON.stringify(request.plugins.rawPayload)
      })
    }

    if (updatePing) {
      yield knex('Device')
        .where({ id: device.id })
        .update({
          lastPingOn: now,
          lastPingFromIp: remoteAddress
        })
    }

    const response = yield* handler(context)

    // Insert all DeviceLog Updates added to context when calling handler
    if (deviceLogId !== null && context.deviceLogUpdates.length > 0) {
      yield knex('DeviceLogUpdate').insert(context.deviceLogUpdates.map(
        update => Object.assign({ deviceLogId }, update)))
    }

    return response
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

  return new DeviceApiContext({
    now,
    device: devices[0],
    constraints,
    payload: request.payload,
    query: request.query
  })
}

class DeviceApiContext {
  constructor(props) {
    Object.assign(this, { deviceLogUpdates: [] }, props)
  }

  withPayload(newPayload) {
    return new DeviceApiContext(Object.assign({}, this, { payload: newPayload }))
  }

  addDeviceConfigurationId(id) {
    this.addDeviceLogUpdate('deviceConfigurationId', id)
  }

  addDeviceOperationId(id) {
    this.addDeviceLogUpdate('deviceOperationId', id)
  }

  addResultId(id) {
    this.addDeviceLogUpdate('resultId', id)
  }

  addDeviceLogUpdate(prop, id) {
    const lastUpdate = this.deviceLogUpdates[this.deviceLogUpdates.length - 1]
    if (!lastUpdate) {
      // no previous update, just add it
      this.deviceLogUpdates.push({ [prop]: id })
    } else if (!(prop in lastUpdate)) {
      // previous update has not set configured prop, re-use it
      lastUpdate[prop] = id
    } else {
      // previous update has set prop, create a new one using previous as template.
      // e.g. allow multiple result updates with single config or operation
      this.deviceLogUpdates.push(Object.assign({}, lastUpdate, { [prop]: id }))
    }
  }
}


module.exports = {
  getExternalId,
  deviceApiHandler
}
