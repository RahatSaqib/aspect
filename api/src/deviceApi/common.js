const Boom = require('boom')
const { knex, transact } = require('../db')
const { getDeviceConstraints } = require('../auth/constraints')
const { asyncHandler } = require('../routes')

function deviceApiHandler(handler, { updatePing, updateDeviceLog }) {
  return asyncHandler(function* (request) {
    const context = yield* getDeviceApiContext(request)
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
    let deviceLogUpdateId = null
    if (updateDeviceLog) {
      const checkpoint = request.payload && request.payload.checkpoint

      ;[deviceLogId] = yield knex('DeviceLog').insert({
        deviceId,
        checkpoint,
        source: 'DeviceAPI',
        createdOn: now,
        senderIp: remoteAddress,
        // TODO DeviceLog handle non-JSON payloads
        rawMessage: JSON.stringify(request.plugins.rawPayload)
      })

      // Need to insert first as checkpoint with log as other
      // updates my occur while next transaction is processing
      // and also to ensure we have a checkpoint even if no
      // updates to related tables occur (checkpoint only request)
      ;[deviceLogUpdateId] = yield knex('DeviceLogUpdate').insert({
        deviceLogId
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

      // Insert all DeviceLog Updates added to context when calling handler
      if (deviceLogId !== null) {
        const { deviceConfigurationUpdated, deviceLogUpdates } = context
        if (deviceLogUpdates.length > 0) {
          const [firstUpdate, ...restUpdates] = deviceLogUpdates
          yield knex('DeviceLogUpdate')
            .where({ id: deviceLogUpdateId })
            .update(Object.assign({ deviceConfigurationUpdated }, firstUpdate))
          if (restUpdates.length > 0) {
            yield knex('DeviceLogUpdate').insert(restUpdates.map(
              update => Object.assign({ deviceLogId, deviceConfigurationUpdated }, update)))
          }
        } else if (deviceConfigurationUpdated) {
          // configuration update but no results or operation
          yield knex('DeviceLogUpdate')
            .where({ id: deviceLogUpdateId })
            .update({ deviceConfigurationUpdated })
        }
      }
    })

    return response
  })
}

function* getDeviceApiContext(request) {
  const { auth } = request
  const now = new Date()
  const devices = yield knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .innerJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
    .where({
      'dak.id': +auth.credentials.dak,
      'dak.revoked': false,
      'ds.token': 'approved'
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
    Object.assign(this, { deviceConfigurationUpdated: false, deviceLogUpdates: [] }, props)
  }

  withPayload(payload) {
    return new DeviceApiContext(Object.assign({}, this, { payload, parent: this }))
  }

  markDeviceConfigurationUpdated() {
    this.deviceConfigurationUpdated = true
    if (this.parent) {
      this.parent.markDeviceConfigurationUpdated()
    }
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
  deviceApiHandler
}
