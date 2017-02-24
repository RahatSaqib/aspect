const Boom = require('boom')
const { knex, transact } = require('../db')
const { getDeviceConstraints, addConstraints } = require('../auth/constraints')
const { asyncHandler } = require('../routes')

const millisInDay = 1000 * 60 * 60 * 24

function deviceApiHandler(handler, {
  updatePing = false,
  updateDeviceLog = false,
  requiredStatus = null,
  requireDeviceLog = false
}) {
  return asyncHandler(function* (request) {
    const context = yield* getDeviceApiContext(request, requiredStatus, requireDeviceLog)
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

function* getDeviceApiContext(request, requiredStatus, requireDeviceLog) {
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

  const devices = yield devicesQ.select('d.id', 'd.name')
  if (devices.length !== 1) {
    return { error: Boom.unauthorized() }
  }

  const constraints = yield getDeviceConstraints(auth.credentials)

  const context = new DeviceApiContext({
    now,
    device: devices[0],
    constraints,
    payload: request.payload,
    query: request.query
  })

  if (requireDeviceLog) {
    const { checkpoint } = request.query
    const offset = +(request.query.offset || 0)
    if (checkpoint == null && offset !== 0) {
      // must specify checkpoint if using offset
      return { error: Boom.badRequest() }
    }

    // Calculate min log date configured by Partner
    const partner = yield knex('Partner as p')
      .innerJoin('Device as d', 'd.partnerId', 'd.id')
      .first('deviceLogHistoryDays')
    if (!partner) {
      return null
    }
    const historyCutoff = new Date(+new Date() - (partner.deviceLogHistoryDays * millisInDay))

    const deviceLog = yield* getDeviceLog(
      devices[0].id, constraints, checkpoint, offset, historyCutoff)
    if (deviceLog == null) {
      // See if requested log is forbidden or not found
      const deviceLogNoHistory = yield* getDeviceLog(
        devices[0].id, constraints, checkpoint, offset)
      return { error: deviceLogNoHistory == null ? Boom.notFound() : Boom.forbidden() }
    }
    context.deviceLog = deviceLog
  }

  return context
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

function* getDeviceLog(deviceId, dataConstraints, checkpoint, offset, historyCutoff) {
  // Find device log at checkpoint or latest
  // normally we want to get the last device log for given device and checkpoint
  let initialDeviceLogOrder = 'desc'
  const initialDeviceLogQuery = knex('DeviceLog')
    .where({ deviceId })
  // use specified checkpoint, otherwise just select latest
  if (checkpoint) {
    initialDeviceLogQuery.where({ checkpoint })

    if (offset > 0) {
      // If we are querying future data, must use minimum device log for
      // this device with same checkpoint so we don't miss data interleaving
      // from other sources while data with checkpoint is being posted
      initialDeviceLogOrder = 'asc'
    }
  }
  if (historyCutoff != null) {
    initialDeviceLogQuery.where('createdOn', '>=', historyCutoff)
  }
  initialDeviceLogQuery.orderBy('id', initialDeviceLogOrder)

  const initialDeviceLog = yield initialDeviceLogQuery
    .first('id', 'checkpoint', 'deviceId', 'createdOn')
  if (!initialDeviceLog) {
    // No log found at checkpoint for this device
    return null
  } else if (offset === 0) {
    // If no offset, return log at checkpoint for this device
    // as checkpoints are unique per device
    return {
      id: initialDeviceLog.id,
      checkpoint: initialDeviceLog.checkpoint,
      createdOn: initialDeviceLog.createdOn
    }
  }

  // We need to consider DeviceLogs with and without
  // the result constraints and return the first entry (minimum log id)
  // Two steps are required because results might be allowed from a
  // different sample origin site (lab/clinic) but device configuration
  // and operation updates are currently always constrained by device
  const deviceLogOffsetQuery = knex('DeviceLog as dl')
    .where({ 'dl.deviceId': deviceId })
    .union(function () {
      this.from('Result as r')
        .innerJoin('Device as d', 'r.deviceId', 'd.id')
        .innerJoin('DeviceLog as dl', 'dl.resultId', 'r.id')
        .leftJoin('Sample as s', 'r.sampleId', 's.id')
        .leftJoin('Site as sos', 's.originSiteId', 'sos.id')
        .modify(addConstraints, dataConstraints, { device: 'd', sample: 's' })
        .select('dl.id')
      if (historyCutoff != null) {
        this.where('dl.createdOn', '>=', historyCutoff)
      }
    })
    .select('dl.id')
    .as('dls')

  if (historyCutoff != null) {
    deviceLogOffsetQuery.where('dl.createdOn', '>=', historyCutoff)
  }

  const deviceLogQuery = knex('DeviceLog as dl')
    .innerJoin(deviceLogOffsetQuery, 'dl.id', 'dls.id')
    .where(function () {
      // do not include logs with same checkpoint for same device
      // since we are retrieving logs with offset from checkpoint
      this.where('dl.deviceId', '<>', initialDeviceLog.deviceId)
        .orWhere('dl.checkpoint', '<>', initialDeviceLog.checkpoint)
        .orWhereNull('dl.checkpoint')
    })
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

  if (historyCutoff != null) {
    deviceLogQuery.where('dl.createdOn', '>=', historyCutoff)
  }

  const deviceLog = yield deviceLogQuery
    .first('dl.id', 'dl.deviceId', 'dl.checkpoint', 'dl.createdOn')
  if (deviceLog == null) {
    return null
  }

  const response = { id: deviceLog.id, createdOn: deviceLog.createdOn }
  // set checkpoint if log changed during query, e.g, due to offset
  // but do not leak checkpoint from different device
  if (deviceLog.deviceId === deviceId) {
    response.checkpoint = deviceLog.checkpoint
  }
  return response
}

module.exports = {
  deviceApiHandler
}
