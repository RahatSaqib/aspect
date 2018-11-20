const Boom = require('boom')
const _ = require('lodash')
const { knex, transact, run } = require('../db')
const { asyncHandler } = require('../routes')
const { deviceStatusToId, deviceTypeToPlugin } = require('../shared/dictionary')

const {
  resultUpdated,
  resultLogged,
  types: { RESULT_UPDATED },
} = require('../result/actions')

const {
  updateDeviceConfiguration,
  getDeviceConfigurationFromDeviceLog,
  getDeviceOperation,
  addDeviceOperation,
  getSite,
  createNewDevice,
} = require('./device')
const { deviceSeen } = require('../device/actions')
const { mergeResult, getResult } = require('./result')
const { loadPlugin } = require('../plugin/registration')

const millisInDay = 1000 * 60 * 60 * 24

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

const addDeviceDataHandler = deviceApiHandler(addDeviceDataWithContext)

const addPluginDeviceDataHandler = deviceApiHandler(addDeviceDataWithContext, {
  transformInitialPayload: true,
})

const updateDeviceConfigurationHandler = deviceApiHandler(
  updateDeviceConfigurationWithContext
)

const addDeviceOperationHandler = deviceApiHandler(
  addDeviceOperationWithContext
)

const mergeResultHandler = deviceApiHandler(mergeResultWithContext)

async function getHandlerOptionsFromContext(
  handler,
  { pluginNames: plugins = [] },
  defaultHandlerOptions = {}
) {
  const handlerOptionGroups = await loadPlugin(plugins, 'handlerOptions')
  return _.merge(
    {},
    defaultHandlerOptions,
    handlerOptionGroups[handler.name] || {}
  )
}

async function getHandlerOptionsFromRequest(
  handler,
  { auth = { credentials: {} }, type = {} },
  defaultHandlerOptions = {}
) {
  let plugins = []
  let partnerPluginName
  let deviceTypePluginName
  const { credentials: { token: deviceApiKeyToken } } = auth
  if (deviceApiKeyToken) {
    ;({ partnerPluginName, deviceTypePluginName } =
      (await knex
        .from('DeviceApiKey as dak')
        .leftJoin('Partner as dak_p', 'dak_p.id', 'dak.partnerId')
        .leftJoin('Device as dev', 'dev.id', 'dak.deviceId')
        .leftJoin('DeviceType as dt', 'dt.id', 'dev.deviceTypeId')
        .leftJoin('Partner as dev_p', 'dev_p.id', 'dev.partnerId')
        .where('dak.token', deviceApiKeyToken)
        .first(
          knex.raw('COALESCE(dev_p.plugin, dak_p.plugin) as partnerPluginName'),
          'dt.plugin as deviceTypePluginName'
        )) || {})
  }
  const { id: deviceTypeId } = type
  if (!deviceTypePluginName && deviceTypeId) {
    ;({ deviceTypePluginName } =
      (await knex
        .from('DeviceType as dt')
        .where('dt.externalId', deviceTypeId)
        .first('dt.plugin as deviceTypePluginName')) || {})
  }
  if (partnerPluginName) {
    plugins = [...plugins, partnerPluginName]
  }
  if (deviceTypePluginName) {
    plugins = [...plugins, deviceTypePluginName]
  }
  const handlerOptionGroups = await loadPlugin(plugins, 'handlerOptions')
  return _.merge(
    {},
    defaultHandlerOptions,
    handlerOptionGroups[handler.name] || {}
  )
}

function deviceApiHandler(handler, defaultHandlerOptions = {}) {
  return asyncHandler(async request => {
    const { error, context } = await createDeviceApiContext(
      handler,
      request,
      defaultHandlerOptions
    )
    if (error) {
      await updateLogs(request)
      return error
    }
    let handlerOptions = await getHandlerOptionsFromContext(
      handler,
      context,
      defaultHandlerOptions
    )
    const { updateDeviceLog = false } = handlerOptions
    const { device, now } = context
    const deviceId = device.id
    // TODO Does Hapi Remote address work through proxies? Check headers?
    const remoteAddress = request.info.remoteAddress || ''

    // Insert Device Log and Update Ping prior to calling handler and
    // in separate transaction so it is recorded even if handler fails
    let deviceLogId = null
    let deviceLogRawMessage = null
    if (updateDeviceLog) {
      const checkpoint = context.payload && context.payload.checkpoint

      // TODO DeviceLog handle non-JSON payloads
      deviceLogRawMessage = JSON.stringify(request.plugins.rawPayload)

      // need to ensure DeviceLog is inserted even if failure below
      ;[deviceLogId] = await knex('DeviceLog').insert({
        deviceId,
        checkpoint,
        source: _.get(context.payload, 'log.source', ''),
        createdOn: now,
        senderIp: remoteAddress,
        rawMessage: deviceLogRawMessage,
      })
    }

    let response = {}
    await context.messageContext.transact(async knex => {
      context.knex = knex
      context.deviceLogId = deviceLogId

      // update timestamps as necessary for original device
      const originalDeviceId = context.device.id
      await updateDeviceTimestamps(context, handlerOptions, remoteAddress)

      // invoke delegate handler
      response = await handler(context)

      // If handler changes device (e.g. GxAlert plugin), update timestamps
      // for new device as necessary
      if (context.device.id !== originalDeviceId) {
        handlerOptions = await getHandlerOptionsFromContext(
          handler,
          context,
          defaultHandlerOptions
        )
        await updateDeviceTimestamps(context, handlerOptions, remoteAddress)
      }

      // Update DeviceLog with changes added to context when calling handler
      if (deviceLogId !== null) {
        const { deviceLogUpdate } = context
        if (deviceLogUpdate != null) {
          await knex('DeviceLog')
            .where({ id: deviceLogId })
            .update(deviceLogUpdate)
        }
      }
    })
    return response
  })
}

async function updateDeviceTimestamps(
  context,
  handlerOptions = {},
  remoteAddress
) {
  const { knex, pluginNames: plugins, device } = context
  const { updatePing = false } = handlerOptions

  const deviceUpdates = {}

  const getDeviceSeenOn = await loadPlugin(plugins, 'getDeviceSeenOn')
  const deviceSeenOn = await getDeviceSeenOn(context)
  if (deviceSeenOn != null) {
    // flag as seen even if handler fails
    deviceUpdates.lastSeenOn = deviceSeenOn
    context.messageContext.dispatch(deviceSeen(device.id))
  }

  if (updatePing) {
    const getDevicePingOn = await loadPlugin(plugins, 'getDevicePingOn')
    const devicePingOn = await getDevicePingOn(context)
    if (devicePingOn != null) {
      deviceUpdates.lastPingOn = devicePingOn
      deviceUpdates.lastPingFromIp = remoteAddress
    }
  }

  if (!_.isEmpty(deviceUpdates)) {
    await knex('Device')
      .where({ id: device.id })
      .update(deviceUpdates)
  }
}

async function addDeviceDataWithContext(context) {
  let response = {}
  const { pluginNames: plugins } = context

  const preProcessAddDeviceData = await loadPlugin(
    plugins,
    'preProcessAddDeviceData'
  )
  await preProcessAddDeviceData(context)

  const { knex, now, payload, device } = context
  const { name, site, result, configuration, operation } = payload

  if (name) {
    await knex('Device')
      .where({ id: device.id })
      .update({ name, updatedOn: now })
  }

  if (site) {
    response = Object.assign(
      {},
      response,
      await updateSiteWithContext(context.withPayload(site))
    )
  }

  if (configuration) {
    response = Object.assign(
      {},
      response,
      await updateDeviceConfigurationWithContext(
        context.withPayload(configuration)
      )
    )
  }

  if (operation) {
    response = Object.assign(
      {},
      response,
      await addDeviceOperationWithContext(context.withPayload(operation))
    )
  }

  if (result) {
    response = Object.assign(
      {},
      response,
      await mergeResultWithContext(context.withPayload(result))
    )
  }

  return response
}

async function getDeviceDataWithContext(context) {
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
    const site = await getSite(knex, context.device.id)
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
      const config = await getDeviceConfigurationFromDeviceLog(
        knex,
        deviceLog.id
      )
      if (config != null) {
        response.configuration = config
      }
    }

    if (includeOp) {
      const op = await getDeviceOperationWithContext(context)
      if (op != null) {
        response.operation = op
      }
    }

    if (includeResult) {
      const result = await getResultWithContext(context)
      if (result != null) {
        response.result = result
      }
    }
  }

  return response
}

async function addDeviceOperationWithContext(context) {
  const {
    knex,
    payload,
    device: { id: deviceId },
    now,
    pluginNames: plugins,
  } = context
  const op = await addDeviceOperation(knex, deviceId, payload, now)
  context.addDeviceLogUpdate('deviceOperationId', op.id)

  const postProcess = await loadPlugin(plugins, 'postProcessAddDeviceOperation')
  const postProcessResult = await postProcess(context)
  return postProcessResult
}

async function updateDeviceConfigurationWithContext(context) {
  const {
    knex,
    payload,
    device: { id: deviceId },
    now,
    pluginNames: plugins,
  } = context

  const preProcess = await loadPlugin(
    plugins,
    'preProcessUpdateDeviceConfiguration'
  )
  await preProcess(context)

  await updateDeviceConfiguration(knex, deviceId, payload, now)
  context.addDeviceLogUpdate('deviceConfigurationUpdated', true)
  const postProcess = await loadPlugin(
    plugins,
    'postProcessUpdateDeviceConfiguration'
  )
  const postProcessResult = await postProcess(context)
  return postProcessResult
}

async function getDeviceOperationWithContext(context) {
  const { knex, deviceLog: { id: deviceLogId } } = context
  const op = await getDeviceOperation(knex, deviceLogId)
  return op
}

async function updateSiteWithContext(context) {
  const { knex, actions, device, payload, now, pluginNames: plugins } = context

  const pluginContext = {
    knex,
    actions,
    payload,
    now,
    deviceType: device.deviceType,
    deviceId: device.id,
  }

  const preProcessUpdateSite = await loadPlugin(plugins, 'preProcessUpdateSite')
  await preProcessUpdateSite(pluginContext)

  const siteExternalId = payload.id || null
  if (siteExternalId == null) {
    throw Boom.badRequest('Must specify site id to update Site')
  }

  // Find unique site with specified external ID for same partner as device
  const sites = await knex('Site as s')
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

  if (device.siteId !== site.id) {
    const status = device.siteId == null ? 'approved' : 'assigned'
    const deviceStatusId = await deviceStatusToId(status)

    await knex('Device')
      .where({ id: device.id })
      .update({
        siteId: site.id,
        deviceStatusId,
      })

    await knex('DeviceStatusLog').insert({
      deviceId: device.id,
      deviceStatusId,
      changedOn: now,
      createdOn: now,
      createdBy: null,
    })

    // Update DeviceApiKey site with the new siteId
    await knex('DeviceApiKey')
      .where({ deviceId: device.id })
      .update({
        siteId: site.id,
      })

    await knex('DeviceSiteHistory').insert({
      deviceId: device.id,
      siteId: site.id,
      createdOn: now,
    })
  }

  const postProcessUpdateSite = await loadPlugin(
    plugins,
    'postProcessUpdateSite'
  )
  await postProcessUpdateSite(
    pluginContext,
    { id: site.id, externalId: siteExternalId },
    { id: device.siteId }
  )
}

async function mergeResultWithContext(context) {
  const {
    knex,
    actions,
    device: { id: deviceId, deviceType },
    pluginNames: plugins,
    payload,
    now,
  } = context

  const pluginContext = {
    knex,
    deviceId,
    actions,
    deviceType,
    payload,
    now,
  }

  const preProcess = await loadPlugin(plugins, 'preProcessMergeResult')
  await preProcess(pluginContext)

  const transformPayload = await loadPlugin(
    plugins,
    'transformMergeResultPayload'
  )
  const transformedPayload = await transformPayload(pluginContext)

  const {
    processedResult: result,
    existingResult: previousResult,
  } = await mergeResult(knex, deviceId, transformedPayload, { now })

  context.addDeviceLogUpdate('resultId', result.id)

  const postProcess = await loadPlugin(plugins, 'postProcessMergeResult')
  const postProcessResult = await postProcess(
    pluginContext,
    result,
    previousResult
  )
  return postProcessResult
}

async function getResultWithContext(context) {
  const {
    knex,
    actions,
    deviceLog: { resultId },
    pluginNames: plugins,
    query,
    now,
  } = context

  const pluginContext = { knex, actions, resultId, query, now }

  const preProcess = await loadPlugin(plugins, 'preProcessGetResult')
  await preProcess(pluginContext)

  const result = await getResult(knex, resultId)

  const postProcess = await loadPlugin(plugins, 'postProcessGetResult')

  const postProcessResult = await postProcess(pluginContext, result)
  return postProcessResult
}

async function createDeviceApiContext(
  handler,
  originalRequest,
  defaultHandlerOptions
) {
  const handlerOptions = await getHandlerOptionsFromRequest(
    handler,
    originalRequest,
    defaultHandlerOptions
  )
  const request = {
    auth: originalRequest.auth,
    params: originalRequest.params,
    payload: originalRequest.payload,
    query: originalRequest.query,
  }
  const {
    createDevice = false,
    deviceLogType = DEVICE_LOG_TYPE_NONE,
  } = handlerOptions

  const messageContext = originalRequest.plugins.messageContext.bindActionCreators(
    {
      resultUpdated,
    }
  )

  if (handlerOptions.transformInitialPayload && request.params.pluginName) {
    const transformInitialPayload = await loadPlugin(
      [request.params.pluginName],
      'transformInitialPayload'
    )
    request.payload = await transformInitialPayload(originalRequest)
  }

  const { auth } = request
  const now = new Date()
  const existingDeviceAndData = await knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .innerJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
    .leftJoin('Partner as p', 'p.id', 'd.partnerId')
    .where({
      'dak.token': auth.credentials.token,
      'dak.revoked': false,
    })
    .first(
      'd.id',
      'd.partnerId',
      'd.siteId',
      'd.geographyId',
      'd.name',
      'd.serial',
      'd.macAddress',
      'd.configurationData',
      'd.lastSeenOn',
      'd.putInService',
      'ds.token as status',
      'dt.externalId as deviceType',
      'dt.plugin as deviceTypePluginName',
      'p.plugin as partnerPluginName',
      'dtc.name as deviceTypeCategory'
    )

  let device = null
  if (existingDeviceAndData != null) {
    device = existingDeviceAndData
  } else if (createDevice) {
    const deviceAndError = await createNewDeviceFromRequest(request, now)
    if (deviceAndError.error) {
      return deviceAndError
    }
    ;({ device } = deviceAndError)
  }

  if (device == null) {
    // Trying to retrieve data for Device that has
    // none uploaded yet, but we have authorized the token
    return { error: Boom.notFound('No device found') }
  }

  const partner = await knex('Partner as p')
    .innerJoin('Device as d', 'd.partnerId', 'p.id')
    .where({ 'd.id': device.id })
    .first('p.id', 'p.deviceLogHistoryDays', 'p.plugin as partnerPluginName')
  if (partner == null) {
    return { error: Boom.internal('Device not assigned to partner') }
  }

  const context = new DeviceApiContext({
    now,
    device,
    payload: request.payload,
    query: request.query,
    messageContext,
    deviceLogType,
    partnerId: partner.id,
    pluginNames: [partner.partnerPluginName, device.deviceTypePluginName],
  })

  // Add Device Log if requested
  if (deviceLogType !== DEVICE_LOG_TYPE_NONE) {
    const { checkpoint, resultId } = request.query
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
      const lastDeviceLogQuery = knex('DeviceLog as dl')
        .where({ 'dl.deviceId': device.id })
        .whereNotNull('dl.checkpoint')
        .orderBy('dl.id', 'desc')
        .first(
          'dl.id',
          'dl.resultId',
          'dl.checkpoint',
          'dl.createdOn',
          'dl.source'
        )
      if (deviceLogType === DEVICE_LOG_TYPE_RESULT) {
        lastDeviceLogQuery.modify(addDeviceLogResultConstraints)
        // if checkpoint not specified but externalId specified
        if (resultId) {
          lastDeviceLogQuery.where({ 'r.externalId': resultId })
        }
      } else if (deviceLogType === DEVICE_LOG_TYPE_OPERATION) {
        lastDeviceLogQuery.whereNotNull('dl.deviceOperationId')
      }
      const lastDeviceLog = await lastDeviceLogQuery
      context.deviceLog = lastDeviceLog || null

      return {
        error:
          lastDeviceLog == null &&
          Boom.notFound('Cannot find specified resultId'),
        context,
      }
    }

    // Calculate min log date configured by Partner
    const historyCutoff = new Date(
      +new Date() - partner.deviceLogHistoryDays * millisInDay
    )
    const deviceLog = await getDeviceLog(
      context,
      checkpoint,
      offset,
      resultId,
      deviceLogType,
      historyCutoff
    )
    if (deviceLog == null) {
      // See if requested log is forbidden or not found
      const deviceLogNoHistory = await getDeviceLog(
        context,
        checkpoint,
        offset,
        resultId,
        deviceLogType,
        null
      )
      return {
        error:
          deviceLogNoHistory == null
            ? Boom.notFound(
                'Cannot find specified checkpoint and offset or resultId'
              )
            : Boom.forbidden(
                'Not authorized to view specified checkpoint and offset or resultId'
              ),
      }
    }
    context.deviceLog = deviceLog.deviceLog
  }

  // finally, all is well
  return { context }
}

function createNewDeviceFromRequest(request, now) {
  return transact(async knex => {
    const { auth } = request

    // Find API Key to use as template for new device
    const partnerApiKey = await knex('DeviceApiKey as k')
      .where({
        'k.token': auth.credentials.token,
        'k.revoked': false,
        'k.deviceId': null,
      })
      .leftJoin('Partner as p', 'p.id', 'k.partnerId')
      .first('k.id', 'k.partnerId', 'k.geographyId', 'k.siteId', 'p.plugin')
    if (partnerApiKey == null) {
      return {
        error: Boom.notFound(
          'Cannot find available API Key when creating new device'
        ),
      }
    }
    const deviceTypePlugin = await deviceTypeToPlugin(
      _.get(request, 'payload.type.id')
    )
    const apiKey = _.assign({}, partnerApiKey, {
      plugins: [_.get(partnerApiKey, 'plugin'), deviceTypePlugin],
    })

    // Require Device Type when creating device
    const transformNewDevicePayload = await loadPlugin(
      apiKey.plugins,
      'transformNewDevicePayload'
    )
    const payload = await transformNewDevicePayload({
      payload: request.payload,
    })

    const preProcessCreateDevice = await loadPlugin(
      apiKey.plugins,
      'preProcessCreateDevice'
    )
    const existingDevice = await preProcessCreateDevice(request, now)

    if (!_.isEmpty(existingDevice)) {
      return { device: existingDevice }
    }

    const deviceTypeExternalId = _.get(payload, 'type.id', null)
    if (deviceTypeExternalId == null) {
      return {
        error: Boom.badRequest(
          'Must specify device type on first request with new key'
        ),
      }
    }

    const { device, error } = await createNewDevice(knex, now, {
      deviceTypeExternalId,
      name: payload.name,
      serial: payload.serial,
      partnerId: apiKey.partnerId,
      siteId: apiKey.siteId,
      geographyId: apiKey.geographyId,
      status: apiKey.siteId ? 'approved' : 'provisioned',
    })

    // Assign new device to API Key
    await knex('DeviceApiKey')
      .where({ id: apiKey.id })
      .update({ deviceId: device.id, updatedOn: now })

    return { device, error }
  })
}

class DeviceApiContext {
  constructor(props) {
    Object.assign(this, props)
    this.resultUpdated = this.resultUpdated.bind(this)
    this.actions = { resultUpdated: this.resultUpdated }
  }

  withPayload(payload) {
    return new DeviceApiContext(
      Object.assign({}, this, { payload, parent: this })
    )
  }

  addDeviceLogUpdate(prop, value) {
    if (this.parent) {
      this.parent.addDeviceLogUpdate(prop, value)
    } else {
      let update = this.deviceLogUpdate
      if (update == null) {
        update = {}
        this.deviceLogUpdate = update
      }

      // add result updated on first device log update
      if (prop === 'resultId' && update[prop] == null) {
        this.resultUpdated(value, this.deviceLogId)
      }
      update[prop] = value
    }
  }

  resultUpdated(resultId, deviceLogId) {
    if (this.parent) {
      this.parent.resultUpdated(resultId, deviceLogId)
    } else if (
      _.findIndex(this.messageContext.actions, {
        type: RESULT_UPDATED,
        resultId,
      }) === -1
    ) {
      // only dispatch result updated action once per result id
      // within this Device API transaction
      this.messageContext.resultUpdated(resultId, deviceLogId)
    }
  }
}

async function getDeviceLog(
  context,
  checkpoint,
  offset,
  resultId,
  deviceLogType,
  historyCutoff
) {
  const { device } = context

  // Find device log at checkpoint or latest
  const initialDeviceLogQuery = knex('DeviceLog as dl')
    .where({
      'dl.deviceId': device.id,
      'dl.checkpoint': checkpoint,
    })
    // If we are querying future data, must use minimum device log for
    // this device with same checkpoint so we don't miss data interleaving
    // from other sources while data with checkpoint is being posted
    .orderBy('id', offset > 0 ? 'asc' : 'desc')
  if (historyCutoff != null) {
    initialDeviceLogQuery.where('dl.createdOn', '>=', historyCutoff)
  }
  if (resultId) {
    initialDeviceLogQuery
      .join('Result as r', 'dl.resultId', 'r.id')
      .where({ 'r.externalId': resultId })
  }
  const initialDeviceLog = await initialDeviceLogQuery.first(
    'dl.id',
    'dl.checkpoint',
    'dl.deviceId',
    'dl.resultId',
    'dl.deviceOperationId',
    'dl.createdOn',
    'dl.source'
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
    return { deviceLog: initialDeviceLog }
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
    deviceLogQuery.modify(addDeviceLogResultConstraints)
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

  const deviceLog = await deviceLogQuery.first(
    'dl.id',
    'dl.deviceId',
    'dl.resultId',
    'dl.checkpoint',
    'dl.createdOn',
    'dl.source'
  )
  if (deviceLog == null) {
    return null
  }

  const response = { deviceLog }
  // set checkpoint if log changed during query, e.g, due to offset
  // but do not leak checkpoint from different device
  if (deviceLog.deviceId === device.id) {
    response.deviceLog.checkpoint = deviceLog.checkpoint
  }
  return response
}

function addDeviceLogResultConstraints(queryBuilder) {
  queryBuilder
    .join('Result as r', 'dl.resultId', 'r.id')
    .join('ResultWorkflowStatus as rws', 'r.resultWorkflowStatusId', 'rws.id')
    .where('r.qcCheck', 1)
    .where('rws.externalId', '<>', 'Purged')
}

async function onResultUpdated({ resultId, deviceLogId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ resultLogged })
  if (deviceLogId) {
    // we've already created device logs originating here, so ignore
    return context.resultLogged(resultId, deviceLogId)
  } else {
    return context.transact(async knex => {
      // TODO dispatch from client API using plugin so
      // senderIp, createdOn, source, etc are available
      // Everything else, we should add a device log entry so that
      // the updates will be downloaded
      const createdOn = new Date()
      const [deviceLogId] = await knex('Result')
        .where({ id: resultId })
        .first('deviceId')
        .then(({ deviceId }) =>
          knex('DeviceLog').insert({
            deviceId,
            resultId,
            source: 'DeviceApiResultUpdated',
            createdOn,
            senderIp: '',
            rawMessage: '',
          })
        )
      context.resultLogged(resultId, deviceLogId)
    })
  }
}

async function onResultLogged(action, context) {
  return run(async knex => {
    const { partnerPluginName, deviceTypePluginName } = await knex(
      'Result as r'
    )
      .leftJoin('Partner as p', 'r.partnerId', 'p.id')
      .leftJoin('Device as d', 'r.deviceId', 'd.id')
      .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .where({ 'r.id': action.resultId })
      .first(
        'p.plugin as partnerPluginName',
        'dt.plugin as deviceTypePluginName'
      )
    const onResultLogged = await loadPlugin(
      [partnerPluginName, deviceTypePluginName],
      'onResultLogged'
    )
    return onResultLogged(action, context)
  })
}

function addDeviceLog(error) {
  return asyncHandler(async request => {
    await updateLogs(request)
    return error
  })
}

async function updateLogs(request) {
  const { auth } = request
  const device = await knex('DeviceApiKey as k')
    .innerJoin('Device as d', 'k.deviceId', 'd.id')
    .where('k.token', auth.credentials.token)
    .first('d.id')

  await knex('DeviceLog').insert({
    deviceId: (device && device.id) || null,
    resultId: null,
    source: _.get(request.payload, 'log.source', ''),
    createdOn: new Date(),
    senderIp: (request.info && request.info.remoteAddress) || '',
    rawMessage: JSON.stringify(request.plugins.rawPayload),
  })
}

module.exports = {
  getDeviceDataHandler,
  getDeviceOperationHandler,
  getResultHandler,
  addDeviceDataHandler,
  addPluginDeviceDataHandler,
  updateDeviceConfigurationHandler,
  addDeviceOperationHandler,
  mergeResultHandler,
  addDeviceLog,
  onResultUpdated,
  onResultLogged,
}
