const Boom = require('boom')
const { knex, transact } = require('../db')
const { getDeviceConstraints } = require('../auth/constraints')
const { asyncHandler } = require('../routes')

function deviceApiHandler(handler, { updatePing, updateDeviceLog, requiredStatus = null }) {
  return asyncHandler(function* (request) {
    const context = yield* getDeviceApiContext(request, requiredStatus)
    if (context.error) {
      // unauthorized, record nothing
      return context.error
    }

    const { device, now } = context
    const deviceId = device.id
    // TODO Does Hapi Remote address work through proxies? Check headers?
    const remoteAddress = request.info.remoteAddress || ''

    // Insert Device Log and Update Ping prior to calling handler and
    // in separate transaction so it is recorded even if handler fails
    let deviceLogId = null
    if (updateDeviceLog) {
      const checkpoint = request.payload && request.payload.checkpoint

      // need to ensure DeviceLog is inserted even if failure below
      ;[deviceLogId] = yield knex('DeviceLog').insert({
        deviceId,
        checkpoint,
        source: 'DeviceAPI',
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

    let response = {}
    yield transact(function* (knex) {
      context.knex = knex

      response = yield* handler(context)

      // Update DeviceLog with changes added to context when calling handler
      if (deviceLogId !== null) {
        const { deviceLogUpdate } = context
        if (deviceLogUpdate != null) {
          yield knex('DeviceLog')
            .where({ id: deviceLogId })
            .update(deviceLogUpdate)
        }
      }
    })

    return response
  })
}

function* getDeviceApiContext(request, requiredStatus) {
  const { auth } = request
  const now = new Date()
  const devicesQ = knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .where({
      'dak.id': +auth.credentials.dak,
      'dak.revoked': false
    })

  if (requiredStatus != null) {
    devicesQ
      .innerJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
      .where({ 'ds.token': requiredStatus })
  }

  const devices = yield devicesQ.select('d.id')
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
    Object.assign(this, props)
  }

  withPayload(payload) {
    return new DeviceApiContext(Object.assign({}, this, { payload, parent: this }))
  }

  markDeviceConfigurationUpdated() {
    this.addDeviceLogUpdate('deviceConfigurationUpdated', true)
  }

  addDeviceOperationId(id) {
    this.addDeviceLogUpdate('deviceOperationId', id)
  }

  addResultId(id) {
    this.addDeviceLogUpdate('resultId', id)
  }

  addDeviceLogUpdate(prop, value) {
    let update = this.deviceLogUpdate
    if (update == null) {
      update = {}
      this.deviceLogUpdate = update
    }

    update[prop] = value
    if (this.parent) {
      this.parent.addDeviceLogUpdate(prop, value)
    }
  }
}

module.exports = {
  deviceApiHandler
}
