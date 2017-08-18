const Boom = require('boom')
const _ = require('lodash')
const { knex, transact } = require('../db')
const { asyncHandler } = require('../routes')
const {
  addListener,
  dispatch,
  notifyResultUpdated,
  notifyResultLogged,
  types: { RESULT_UPDATED, RESULT_LOGGED },
} = require('../messages')

const {
  updateDeviceConfiguration,
  getDeviceConfigurationFromDeviceLog,
  getDeviceOperation,
  addDeviceOperation,
  getSite,
} = require('./device')
const { mergeResult, getResult } = require('./result')
const { loadPlugin } = require('./plugin/registration')

const millisInDay = 1000 * 60 * 60 * 24

// Source for messages so we can skip logs that we handled ourselves
// Note that this is a bit of a hack and is not stored in the DB
const DEVICE_LOG_COMMON_SOURCE = 'DeviceApiCommon'

const DEVICE_LOG_TYPE_NONE = 0
const DEVICE_LOG_TYPE_OPTIONAL = 1
const DEVICE_LOG_TYPE_OPERATION = 2
const DEVICE_LOG_TYPE_RESULT = 3

const getDeviceDataHandler = deviceApiHandler(getDeviceDataWithContext, {
  deviceLogType: DEVICE_LOG_TYPE_OPTIONAL,
})

const getDeviceOperationHandler = deviceApiHandler(getDeviceDataWithContext, {
  deviceLogType: DEVICE_LOG_TYPE_OPERATION,
})

const getResultHandler = deviceApiHandler(getDeviceDataWithContext, {
  deviceLogType: DEVICE_LOG_TYPE_RESULT,
})

const addDeviceDataHandler = deviceApiHandler(addDeviceDataWithContext, {
  createDevice: true,
  updatePing: true,
  updateDeviceLog: true,
})

const updateDeviceConfigurationHandler = deviceApiHandler(
  updateDeviceConfigurationWithContext,
  {
    updatePing: true,
    updateDeviceLog: true,
  }
)

const addDeviceOperationHandler = deviceApiHandler(
  addDeviceOperationWithContext,
  {
    updatePing: true,
    updateDeviceLog: true,
  }
)

const mergeResultHandler = deviceApiHandler(mergeResultWithContext, {
  updatePing: true,
  updateDeviceLog: true,
})

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
    let deviceLogRawMessage = null
    if (updateDeviceLog) {
      const checkpoint = request.payload && request.payload.checkpoint

      // TODO DeviceLog handle non-JSON payloads
      deviceLogRawMessage = JSON.stringify(request.plugins.rawPayload)

      // need to ensure DeviceLog is inserted even if failure below
      ;[deviceLogId] = yield knex('DeviceLog').insert({
        deviceId,
        checkpoint,
        source: _.get(request.payload, 'log.source', ''),
        createdOn: now,
        senderIp: remoteAddress,
        rawMessage: deviceLogRawMessage,
      })
    }

    const deviceUpdates = { lastSeenOn: now }
    if (updatePing) {
      deviceUpdates.lastPingOn = now
      deviceUpdates.lastPingFromIp = remoteAddress
    }
    yield knex('Device').where({ id: device.id }).update(deviceUpdates)

    let response = {}
    let deviceLogUpdate = null
    yield transact(function*(knex) {
      context.knex = knex
      response = yield* handler(context)

      // Update DeviceLog with changes added to context when calling handler
      if (deviceLogId !== null) {
        deviceLogUpdate = context.deviceLogUpdate
        if (deviceLogUpdate != null) {
          yield knex('DeviceLog')
            .where({ id: deviceLogId })
            .update(deviceLogUpdate)
        }
      }
    })

    // Dispatch actions outside of transaction
    if (deviceLogUpdate != null && deviceLogUpdate.resultId != null) {
      dispatch(
        notifyResultUpdated(
          deviceLogUpdate.resultId,
          { deviceLogId },
          DEVICE_LOG_COMMON_SOURCE
        )
      )
    }

    return response
  })
}

function* addDeviceDataWithContext(context) {
  const response = {}
  const { knex, now, payload, device } = context
  const { name, site, result, configuration, operation } = payload

  if (name) {
    yield knex('Device')
      .where({ id: device.id })
      .update({ name, updatedOn: now })
  }

  if (site) {
    yield* updateSiteWithContext(context.withPayload(site))
  }

  if (configuration) {
    yield* updateDeviceConfigurationWithContext(
      context.withPayload(configuration)
    )
  }

  if (operation) {
    yield* addDeviceOperationWithContext(context.withPayload(operation))
  }

  if (result) {
    yield* mergeResultWithContext(context.withPayload(result))
  }

  return response
}

function* getDeviceDataWithContext(context) {
  const { knex, now, device, deviceLog, deviceLogType } = context

  // include fields based on device log type configured in endpoints
  const includeAll = deviceLogType === DEVICE_LOG_TYPE_OPTIONAL
  const includeDevice = includeAll
  const includeSite = includeAll

  // only include device data if approved
  const deviceApproved = device.status === 'approved'
  const includeConfig = deviceApproved && includeAll
  const includeOp =
    deviceApproved &&
    (includeAll || deviceLogType === DEVICE_LOG_TYPE_OPERATION)
  const includeResult =
    deviceApproved && (includeAll || deviceLogType === DEVICE_LOG_TYPE_RESULT)

  const response = { requestedOn: now.toISOString() }
  if (includeDevice) {
    response.name = device.name
    response.status = { id: device.status }
  }

  if (includeSite) {
    const site = yield* getSite(knex, context.device.id)
    if (site != null) {
      response.site = site
    }
  }

  if (deviceLog != null) {
    response.log = { createdOn: deviceLog.createdOn }
    if (deviceLog.source != null) {
      response.log.source = deviceLog.source
    }

    if (deviceLog.checkpoint != null) {
      response.checkpoint = deviceLog.checkpoint
    }

    if (includeConfig) {
      const config = yield* getDeviceConfigurationFromDeviceLog(
        knex,
        deviceLog.id
      )
      if (config != null) {
        response.configuration = config
      }
    }

    if (includeOp) {
      const op = yield* getDeviceOperationWithContext(context)
      if (op != null) {
        response.operation = op
      }
    }

    if (includeResult) {
      const result = yield* getResultWithContext(context)
      if (result != null) {
        response.result = result
      }
    }
  }

  return response
}

function* addDeviceOperationWithContext(context) {
  const { knex, payload, device: { id: deviceId }, now } = context
  const op = yield* addDeviceOperation(knex, deviceId, payload, now)
  context.addDeviceLogUpdate('deviceOperationId', op.id)
  return {}
}

function* updateDeviceConfigurationWithContext(context) {
  const { knex, payload, device: { id: deviceId } } = context
  const config = yield* updateDeviceConfiguration(knex, deviceId, payload)
  context.addDeviceLogUpdate('deviceConfigurationUpdated', true)
  return config
}

function* getDeviceOperationWithContext(context) {
  const { knex, deviceLog: { id: deviceLogId } } = context
  const op = yield* getDeviceOperation(knex, deviceLogId)
  return op
}

function* updateSiteWithContext(context) {
  const { knex, payload, device, now } = context
  const result = {}
  const siteExternalId = payload.id || null
  if (siteExternalId == null) {
    throw Boom.badRequest('Must specify site id to update Site')
  }

  // Find unique site with specified external ID for same partner as device
  const sites = yield knex('Site as s')
    .where({
      partnerId: device.partnerId,
      externalId: siteExternalId,
    })
    .select('id')
    .limit(2)
  if (sites.length !== 1) {
    throw Boom.badRequest(`Cannot find unique site with id ${siteExternalId}`)
  }
  const site = sites[0]

  if (device.siteId === site.id) {
    // Device is already assigned to requested site, nothing to do
    return result
  }

  const status = device.siteId == null ? 'approved' : 'assigned'

  yield knex('Device').where({ id: device.id }).update({
    siteId: site.id,
    deviceStatusId: knex('DeviceStatus').where({ token: status }).select('id'),
  })

  // Update DeviceApiKey site with the new siteId
  yield knex('DeviceApiKey').where({ deviceId: device.id }).update({
    siteId: site.id,
  })

  yield knex('DeviceSiteHistory').insert({
    deviceId: device.id,
    siteId: site.id,
    createdOn: now,
  })

  return result
}

function* mergeResultWithContext(context) {
  const {
    knex,
    device: { id: deviceId, deviceType },
    pluginName: plugin,
    payload,
    now,
  } = context

  const pluginContext = {
    knex,
    deviceType,
    payload,
    now,
  }

  const preProcess = yield* loadPlugin(plugin, 'preProcessMergeResult')
  yield* preProcess(pluginContext)

  const transformPayload = yield* loadPlugin(
    plugin,
    'transformMergeResultPayload'
  )
  const transformedPayload = yield* transformPayload(pluginContext)

  const {
    processedResult: result,
    existingResult: previousResult,
  } = yield* mergeResult(knex, deviceId, transformedPayload, now, knex)

  context.addDeviceLogUpdate('resultId', result.id)

  const postProcess = yield* loadPlugin(plugin, 'postProcessMergeResult')
  return yield* postProcess(pluginContext, result, previousResult)
}

function* getResultWithContext(context) {
  const {
    knex,
    deviceLog: { id: deviceLogId },
    pluginName: plugin,
    query,
    now,
  } = context

  const pluginContext = { knex, deviceLogId, query, now }

  const preProcess = yield* loadPlugin(plugin, 'preProcessGetResult')
  yield* preProcess(pluginContext)

  const result = yield* getResult(knex, deviceLogId)

  const postProcess = yield* loadPlugin(plugin, 'postProcessGetResult')

  return yield* postProcess(pluginContext, result)
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

  deviceLogQuery.where({ 'dl.deviceId': device.id })
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

function onResultUpdated({ resultId, message, source }) {
  if (source === DEVICE_LOG_COMMON_SOURCE) {
    // we've already created device logs originating here, so ignore
    dispatch(notifyResultLogged(resultId, message.deviceLogId))
  } else {
    // TODO dispatch from client API using plugin so
    // senderIp, createdOn, source, etc are available
    // Everything else, we should add a device log entry so that
    // the updates will be downloaded
    const createdOn = new Date()
    const updateDeviceLog = ({ deviceId }) =>
      knex('DeviceLog').insert({
        deviceId,
        resultId,
        source,
        createdOn,
        senderIp: '',
        rawMessage: JSON.stringify(message),
      })

    knex('Result')
      .where({ id: resultId })
      .first('deviceId')
      .then(updateDeviceLog)
      .then(([deviceLogId]) =>
        dispatch(notifyResultLogged(resultId, deviceLogId))
      )
  }
}

function onResultLogged({ resultId, deviceLogId }) {
  transact(function*(knex) {
    const { plugin } = yield knex('Result as r')
      .join('Partner as p', 'r.partnerId', 'p.id')
      .where({ 'r.id': resultId })
      .first('p.plugin')
    const onResultLogged = yield* loadPlugin(plugin, 'onResultLogged')
    const now = new Date()
    const context = {
      knex,
      now,
      resultId,
      deviceLogId,
    }
    yield* onResultLogged(context)
  })
}

addListener(RESULT_UPDATED, onResultUpdated)
addListener(RESULT_LOGGED, onResultLogged)

module.exports = {
  getDeviceDataHandler,
  getDeviceOperationHandler,
  getResultHandler,
  addDeviceDataHandler,
  updateDeviceConfigurationHandler,
  addDeviceOperationHandler,
  mergeResultHandler,
}
