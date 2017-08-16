const Boom = require('boom')
const _ = require('lodash')
const { knex, transact } = require('../db')
const { asyncHandler } = require('../routes')

const { loadPlugin } = require('./plugin/registration')

const millisInDay = 1000 * 60 * 60 * 24

const DEVICE_LOG_TYPE_NONE = 0
const DEVICE_LOG_TYPE_OPTIONAL = 1
const DEVICE_LOG_TYPE_OPERATION = 2
const DEVICE_LOG_TYPE_RESULT = 3

function deviceApiHandler(handler, handlerOptions) {
  return asyncHandler(function*(request) {
    const { error, context } = yield* createDeviceApiContext(
      request,
      handlerOptions
    )
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
        source: _.get(request.payload, 'log.source', ''),
        createdOn: now,
        senderIp: remoteAddress,
        // TODO DeviceLog handle non-JSON payloads
        rawMessage: JSON.stringify(request.plugins.rawPayload),
      })
    }

    const deviceUpdates = { lastSeenOn: now }
    if (updatePing) {
      deviceUpdates.lastPingOn = now
      deviceUpdates.lastPingFromIp = remoteAddress
    }
    yield knex('Device').where({ id: device.id }).update(deviceUpdates)

    let response = {}
    yield transact(function*(knex) {
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
    deviceLogType = DEVICE_LOG_TYPE_NONE,
  } = handlerOptions
  const { auth } = request
  const now = new Date()
  const existingDeviceAndData = yield knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .innerJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
    .where({
      'dak.token': auth.credentials.token,
      'dak.revoked': false,
    })
    .first(
      'd.id',
      'd.name',
      'd.serial',
      'd.partnerId',
      'd.siteId',
      'ds.token as status',
      'dt.externalId as deviceType',
      'dtc.name as deviceTypeCategory'
    )

  let device = null
  if (existingDeviceAndData != null) {
    device = existingDeviceAndData
  } else if (createDevice) {
    const deviceAndError = yield createNewDevice(request, now)
    if (deviceAndError.error) {
      return deviceAndError
    }
    device = deviceAndError.device
  }

  if (device == null) {
    // Trying to retrieve data for Device that has
    // none uploaded yet, but we have authorized the token
    return { error: Boom.notFound('No device found') }
  }

  const partner = yield knex('Partner as p')
    .innerJoin('Device as d', 'd.partnerId', 'p.id')
    .where({ 'd.id': device.id })
    .first('p.id', 'p.deviceLogHistoryDays', 'p.plugin')
  if (partner == null) {
    return { error: Boom.internal('Device not assigned to partner') }
  }

  const context = new DeviceApiContext({
    now,
    device,
    payload: request.payload,
    query: request.query,
    deviceLogType,
    partnerId: partner.id,
    pluginName: partner.plugin,
  })

  // Add Device Log if requested
  if (deviceLogType !== DEVICE_LOG_TYPE_NONE) {
    const { checkpoint } = request.query
    const offset = +(request.query.offset || 0)

    if (existingDeviceAndData == null) {
      // We will only have a device log if we already had a device
      return { error: Boom.notFound('Device does not have data.') }
    }

    if (checkpoint == null) {
      if (offset !== 0) {
        // must specify checkpoint if using offset
        return {
          error: Boom.badRequest('Must specify checkpoint if using offset'),
        }
      }
      // Checkpoint not specified, return last one for this device
      const lastDeviceLogQuery = knex('DeviceLog')
        .where({ deviceId: device.id })
        .whereNotNull('checkpoint')
        .orderBy('id', 'desc')
        .first('id', 'checkpoint', 'createdOn', 'source')
      if (deviceLogType === DEVICE_LOG_TYPE_RESULT) {
        lastDeviceLogQuery.whereNotNull('resultId')
      } else if (deviceLogType === DEVICE_LOG_TYPE_OPERATION) {
        lastDeviceLogQuery.whereNotNull('deviceOperationId')
      }
      const lastDeviceLog = yield lastDeviceLogQuery
      context.deviceLog = lastDeviceLog || null
      return { context }
    }

    // Calculate min log date configured by Partner
    const historyCutoff = new Date(
      +new Date() - partner.deviceLogHistoryDays * millisInDay
    )
    const deviceLog = yield* getDeviceLog(
      context,
      checkpoint,
      offset,
      deviceLogType,
      historyCutoff
    )
    if (deviceLog == null) {
      // See if requested log is forbidden or not found
      const deviceLogNoHistory = yield* getDeviceLog(
        context,
        checkpoint,
        offset,
        deviceLogType,
        null
      )
      return {
        error:
          deviceLogNoHistory == null
            ? Boom.notFound('Cannot find specified checkpoint and offset')
            : Boom.forbidden(
                'Not authorized to view specified checkpoint and offset'
              ),
      }
    }
    context.deviceLog = deviceLog.deviceLog
  }

  // finally, all is well
  return { context }
}

function createNewDevice(request, now) {
  return transact(function*(knex) {
    const { auth, payload } = request

    // Require Device Type when creating device
    const deviceTypeExternalId = _.get(payload, 'type.id', null)
    if (deviceTypeExternalId == null) {
      return {
        error: Boom.badRequest(
          'Must specify device type on first request with new key'
        ),
      }
    }
    const deviceType = yield knex('DeviceType')
      .where({ externalId: deviceTypeExternalId })
      .first('id', 'name')
    if (deviceType == null) {
      return {
        error: Boom.badRequest(
          `Cannot find DeviceType with id ${deviceTypeExternalId}`
        ),
      }
    }

    // Find API Key to use as template for new device
    const apiKey = yield knex('DeviceApiKey')
      .where({
        token: auth.credentials.token,
        revoked: false,
        deviceId: null,
      })
      .first('id', 'partnerId', 'geographyId', 'siteId')
    if (apiKey == null) {
      return {
        error: Boom.notFound(
          'Cannot find available API Key when creating new device'
        ),
      }
    }

    // Use or generate device name
    let name
    if (payload.name) {
      name = payload.name
    } else if (payload.serial) {
      name = payload.serial
    } else {
      const [deviceCount] = yield knex('Device')
        .where({
          partnerId: apiKey.partnerId,
          deviceTypeId: deviceType.id,
        })
        .count('id as cnt')
      name = `${deviceType.name} #${deviceCount.cnt + 1}`
    }

    // create new device based on API Key
    const device = {
      partnerId: apiKey.partnerId,
      siteId: apiKey.siteId,
      name,
      serial: payload.serial,
      status: apiKey.siteId ? 'approved' : 'provisioned',
      deviceType: deviceTypeExternalId,
    }
    const inserts = {
      partnerId: device.partnerId,
      geographyId: apiKey.geographyId,
      siteId: device.siteId,
      deviceTypeId: deviceType.id,
      deviceStatusId: knex('DeviceStatus')
        .where({ token: device.status })
        .select('id'),
      name: device.name,
      serial: device.serial,
      configurationData: '{}',
      putInService: now,
      lastSeenOn: now,
      createdOn: now,
      updatedOn: now,
    }
    if (device.status === 'approved') {
      // TODO DeviceStatusLog ASP-340
      inserts.approvedOn = now
    }
    const [deviceId] = yield knex('Device').insert(inserts)
    device.id = deviceId

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
    return new DeviceApiContext(
      Object.assign({}, this, { payload, parent: this })
    )
  }

  markDeviceConfigurationUpdated() {
    this.addDeviceLogUpdate('deviceConfigurationUpdated', true)
  }

  addDeviceOperationId(id) {
    this.addDeviceLogUpdate('deviceOperationId', id)
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

  *withTransformedResultPayload() {
    const transformResultPayload = yield* loadPlugin(
      this.pluginName,
      'transformResultPayload'
    )
    const transformedPayload = yield* transformResultPayload(this)
    return this.withPayload(transformedPayload)
  }

  *postProcessResult(result, previousResult) {
    this.addDeviceLogUpdate('resultId', result.id)
    const postProcessResult = yield* loadPlugin(
      this.pluginName,
      'postProcessResult'
    )
    return yield* postProcessResult(this, result, previousResult)
  }
}

function* getDeviceLog(
  context,
  checkpoint,
  offset,
  deviceLogType,
  historyCutoff
) {
  const { device } = context

  // Find device log at checkpoint or latest
  const initialDeviceLogQuery = knex('DeviceLog')
    .where({
      deviceId: device.id,
      checkpoint,
    })
    // If we are querying future data, must use minimum device log for
    // this device with same checkpoint so we don't miss data interleaving
    // from other sources while data with checkpoint is being posted
    .orderBy('id', offset > 0 ? 'asc' : 'desc')
  if (historyCutoff != null) {
    initialDeviceLogQuery.where('createdOn', '>=', historyCutoff)
  }
  const initialDeviceLog = yield initialDeviceLogQuery.first(
    'id',
    'checkpoint',
    'deviceId',
    'resultId',
    'deviceOperationId',
    'createdOn',
    'source'
  )
  if (!initialDeviceLog) {
    // No log found at checkpoint for this device
    return null
  } else if (offset === 0) {
    // If no offset, return log at checkpoint for this device
    // as checkpoints are unique per device
    if (
      deviceLogType === DEVICE_LOG_TYPE_RESULT &&
      initialDeviceLog.resultId == null
    ) {
      // if we requested a log with result but we don't have one, 404
      return null
    }

    if (
      deviceLogType === DEVICE_LOG_TYPE_OPERATION &&
      initialDeviceLog.deviceOperationId == null
    ) {
      // if we requested a log with operation but we don't have one, 404
      return null
    }
    return {
      deviceLog: {
        id: initialDeviceLog.id,
        checkpoint: initialDeviceLog.checkpoint,
        createdOn: initialDeviceLog.createdOn,
        source: initialDeviceLog.source,
      },
    }
  }

  // Find log at specified offset from checkpoint
  const deviceLogQuery = knex('DeviceLog as dl').where(function() {
    // do not include logs with same checkpoint for same device
    // since we are retrieving logs with offset from checkpoint
    this.where('dl.deviceId', '<>', initialDeviceLog.deviceId)
      .orWhere('dl.checkpoint', '<>', initialDeviceLog.checkpoint)
      .orWhereNull('dl.checkpoint')
  })

  if (deviceLogType === DEVICE_LOG_TYPE_RESULT) {
    deviceLogQuery.whereNotNull('dl.resultId')
  } else if (deviceLogType === DEVICE_LOG_TYPE_OPERATION) {
    deviceLogQuery.whereNotNull('dl.deviceOperationId')
  }

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

  if (device.siteId == null || device.deviceTypeCategory !== 'Client') {
    // If the device is not assigned to site or if it's not a client
    // device, we only need to ensure log originates from device
    deviceLogQuery.where({ 'dl.deviceId': device.id })
  } else {
    // We need to consider DeviceLogs with and without
    // the result constraints and return the first entry (minimum log id)
    // Two steps are required because results might be allowed from a
    // different sample origin site (lab/clinic) but device configuration
    // and operation updates are currently always constrained by device
    const deviceLogOffsetQuery = knex('Device as d')
      .innerJoin('DeviceLog as dl', 'dl.deviceId', 'd.id')
      .where({ 'd.id': device.id })
      .select('dl.id')
      .union(function() {
        this.from('Result as r')
          .innerJoin('Device as d', 'r.deviceId', 'd.id')
          .innerJoin('DeviceLog as dl', 'dl.resultId', 'r.id')
          .leftJoin('Sample as s', 'r.sampleId', 's.id')
          .modify(addResultConstraints, context, {
            device: 'd',
            result: 'r',
            sample: 's',
          })
          .select('dl.id')
        if (historyCutoff != null) {
          this.where('dl.createdOn', '>=', historyCutoff)
        }
      })
      .as('dls')
    if (deviceLogType === DEVICE_LOG_TYPE_RESULT) {
      deviceLogOffsetQuery.whereNotNull('dl.resultId')
    } else if (deviceLogType === DEVICE_LOG_TYPE_OPERATION) {
      deviceLogOffsetQuery.whereNotNull('dl.deviceOperationId')
    }
    if (historyCutoff != null) {
      deviceLogOffsetQuery.where('dl.createdOn', '>=', historyCutoff)
    }

    deviceLogQuery.innerJoin(deviceLogOffsetQuery, 'dl.id', 'dls.id')
  }

  if (historyCutoff != null) {
    deviceLogQuery.where('dl.createdOn', '>=', historyCutoff)
  }

  const deviceLog = yield deviceLogQuery.first(
    'dl.id',
    'dl.deviceId',
    'dl.checkpoint',
    'dl.createdOn',
    'dl.source'
  )
  if (deviceLog == null) {
    return null
  }

  const response = {
    deviceLog: {
      id: deviceLog.id,
      createdOn: deviceLog.createdOn,
      source: deviceLog.source,
    },
  }
  // set checkpoint if log changed during query, e.g, due to offset
  // but do not leak checkpoint from different device
  if (deviceLog.deviceId === device.id) {
    response.deviceLog.checkpoint = deviceLog.checkpoint
  }
  return response
}

function addResultConstraints(queryBuilder, context, aliases) {
  const { device } = context
  if (device.siteId == null || device.deviceTypeCategory !== 'Client') {
    // If the device is not assigned to site or if it's not a client
    // device, we only need to ensure log originates from device
    queryBuilder.where(`${aliases.device}.id`, device.id)
  } else {
    // We need to consider DeviceLogs with and without
    // the result constraints and return the first entry (minimum log id)
    // Two steps are required because results might be allowed from a
    // different sample origin site (lab/clinic) but device configuration
    // and operation updates are currently always constrained by device
    queryBuilder.where(function() {
      this.where(`${aliases.device}.id`, device.id)
      this.orWhere(`${aliases.sample}.originSiteId`, device.siteId)
    })
  }
}

module.exports = {
  deviceApiHandler,
  addResultConstraints,
  DEVICE_LOG_TYPE_OPTIONAL,
  DEVICE_LOG_TYPE_OPERATION,
  DEVICE_LOG_TYPE_RESULT,
}
