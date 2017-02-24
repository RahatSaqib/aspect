const Boom = require('boom')
const { knex, transact } = require('../db')
const { getDeviceConstraints, addConstraints } = require('../auth/constraints')
const { asyncHandler } = require('../routes')

function deviceApiHandler(handler, handlerOptions) {
  return asyncHandler(function* (request) {
    const { error, context } = yield* createDeviceApiContext(request, handlerOptions)
    const { updatePing = false, updateDeviceLog = false } = handlerOptions
    if (error) {
      // unauthorized or other error record nothing
      return error
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

function* createDeviceApiContext(request, handlerOptions) {
  const {
    createDevice = false,
    requiredStatus = null,
    requireDeviceLog = false
  } = handlerOptions
  const { auth } = request
  const now = new Date()
  let device = yield knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .innerJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
    .where({
      'dak.token': auth.credentials.token,
      'dak.revoked': false
    })
    .first('d.id', 'd.name', 'd.serial', 'ds.token as status')

  if (device == null && createDevice) {
    const deviceAndError = yield createNewDevice(request, now)
    if (deviceAndError.error) {
      return deviceAndError
    }
    device = deviceAndError.device
  }

  if (device == null) {
    // Trying to retrieve data for Device that has
    // none uploaded yet, but we have authorized the token
    return { error: Boom.notFound() }
  }

  if (requiredStatus != null && requiredStatus !== device.status) {
    // found device, but not correct status
    return { error: Boom.unauthorized() }
  }

  const constraints = yield getDeviceConstraints(auth.credentials)

  let deviceLog = null
  if (requireDeviceLog) {
    const offset = +(request.query.offset || 0)
    deviceLog = yield* getDeviceLog(
      device.id, constraints, request.query.checkpoint, offset)
    if (deviceLog == null) {
      return { error: Boom.notFound() }
    }
  }

  const context = new DeviceApiContext({
    now,
    device,
    deviceLog,
    constraints,
    payload: request.payload,
    query: request.query
  })

  return { context }
}

function createNewDevice(request, now) {
  return transact(function* (knex) {
    const { auth, payload } = request

    // Find API Key to use as template for new device
    const apiKey = yield knex('DeviceApiKey')
      .where({
        token: auth.credentials.token,
        revoked: false,
        deviceId: null
      })
      .first('id', 'partnerId', 'orgUnitId', 'geographyId', 'siteId', 'deviceTypeId')
    if (apiKey == null) {
      return { error: Boom.notFound() }
    }

    // create new device based on API Key
    const device = {
      name: payload.name || payload.serial || '',
      serial: payload.serial || '',
      status: apiKey.siteId ? 'approved' : 'provisioned'
    }
    const inserts = {
      partnerId: apiKey.partnerId,
      orgUnitId: apiKey.orgUnitId,
      geographyId: apiKey.geographyId,
      siteId: apiKey.siteId,
      deviceTypeId: apiKey.deviceTypeId,
      deviceStatusId: knex('DeviceStatus').where({ token: device.status }).select('id'),
      name: device.name,
      serial: device.serial,
      configurationData: '{}',
      putInService: now,
      createdOn: now,
      updatedOn: now
    }
    if (device.status === 'approved') {
      // TODO DeviceStatusLog ASP-340
      inserts.approvedOn = now
    }
    const [deviceId] = yield knex('Device').insert(inserts)
    device.id = deviceId

    // generate serial and name if not specified
    if (!device.serial) {
      const updates = {}
      device.serial = `ASP-${103539183 + deviceId}`
      updates.serial = device.serial
      if (!device.name) {
        device.name = device.serial
        updates.name = device.name
      }
      yield knex('Device')
        .where({ id: device.id })
        .update(updates)
    }

    // Assign new device to API Key
    yield knex('DeviceApiKey')
      .where({ id: apiKey.id })
      .update({ deviceId, updatedOn: now })

    return { device }
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

function* getDeviceLog(deviceId, dataConstraints, checkpoint, offset) {
  // Find device log at checkpoint or latest
  const initialDeviceLogQuery = knex('DeviceLog')
    .where({ deviceId })
    .orderBy('id', 'desc')
  // use specified checkpoint, otherwise just select latest
  if (checkpoint) {
    initialDeviceLogQuery.where({ checkpoint })
  }
  const initialDeviceLog = yield initialDeviceLogQuery.first('checkpoint', 'id')
  if (!initialDeviceLog) {
    // No log found at checkpoint for this device
    return null
  } else if (offset === 0) {
    // If no offset, return log at checkpoint for this device
    // as checkpoints are unique per device
    return {
      id: initialDeviceLog.id,
      checkpoint: initialDeviceLog.checkpoint
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
      .where('dl.id', '>', initialDeviceLog.id)
      .orderBy('dl.id', 'asc')
    if (offset > 1) {
      // specify query offset if immediately after
      deviceLogQuery.offset(offset - 1)
    }
  } else if (offset < 0) {
    // select result before specified log entry
    deviceLogQuery
      .where('dl.id', '<', initialDeviceLog.id)
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

module.exports = {
  deviceApiHandler
}
