const Boom = require('@hapi/boom')
const _ = require('lodash')
const Promise = require('bluebird')

const crypto = require('crypto')
const { knex, transact } = require('../db')
const { getUser } = require('../auth/service')
const { getRemoteAddress } = require('../shared/request')
const { asyncHandler } = require('../routes')
const { deviceApprovalToId, deviceTypeToPlugin, deviceMaintenanceTypeToId } = require('../shared/dictionary')
const {
  resultUpdated,
  resultLogged,
  resultLoggedProcessed,
  resultReadyForNotification,
  types: { RESULT_UPDATED },
} = require('../result/actions')
const templateProcessor = require('../email/templateProcessor')
const {
  updateDeviceConfiguration,
  getDeviceConfigurationFromDeviceLog,
  getDeviceOperation,
  addDeviceOperation,
  getSite,
  createNewDevice,
} = require('./device')
const { deviceSeen } = require('../device/actions')
const { mergeResult } = require('./result')
const { loadPlugin } = require('../plugin/loadPlugin')
const { shouldTriggerHardwareErrorAnalysis, shouldLogDeviceCalibration } = require('../plugin/utils')
const logger = require('../shared/logger')
const { getTbResultsStats } = require('./pakistan/pakistanTbService')
const { sendSms } = require('../sms/smsUtil')
const { sendEmail } = require('../email/emailUtil')

const getResultPakistanHandler = deviceApiHandler(getTbResultsStats)

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
const addDeviceDataFastHandler = deviceApiHandler(addDeviceDataWithContext, {}, true)

const addPluginDeviceDataHandler = deviceApiHandler(addDeviceDataWithContext, {
  transformInitialPayload: true,
})

const updateDeviceConfigurationHandler = deviceApiHandler(updateDeviceConfigurationWithContext)

const addDeviceOperationHandler = deviceApiHandler(addDeviceOperationWithContext)

const mergeResultHandler = deviceApiHandler(mergeResultWithContext)

async function getHandlerOptionsFromContext(handler, { pluginNames: plugins = [] }, defaultHandlerOptions = {}) {
  const handlerOptionGroups = await loadPlugin(plugins, 'handlerOptions')
  return _.merge({}, defaultHandlerOptions, handlerOptionGroups[handler.name] || {})
}

async function getHandlerOptionsFromRequest(
  handler,
  { auth = { credentials: {} }, type = {} },
  defaultHandlerOptions = {}
) {
  let plugins = []
  let partnerPluginName
  let deviceTypePluginName
  const {
    credentials: { token: deviceApiKeyToken },
  } = auth
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
  return _.merge({}, defaultHandlerOptions, handlerOptionGroups[handler.name] || {})
}

function deviceApiHandler(handler, defaultHandlerOptions = {}, isFastImport = false) {
  return asyncHandler(async request => {
    logger.debug('createDeviceApiContext', {
      reLabel: 'deviceApi:createDeviceApiContext',
    })
    const { error, context } = await createDeviceApiContext(handler, request, defaultHandlerOptions)
    if (error) {
      logger.debug('Update logs because an error', {
        reLabel: 'deviceApi:deviceApiHandler',
      })
      await updateLogs(request)
      return error
    }
    logger.debug('getting handler options from context', {
      reLabel: 'deviceApi:deviceApiHandler',
    })

    let handlerOptions = await getHandlerOptionsFromContext(handler, context, defaultHandlerOptions)
    const { updateDeviceLog = false } = handlerOptions
    const { device, now } = context
    const deviceId = device.id
    // TODO Does Hapi Remote address work through proxies? Check headers?
    const remoteAddress = getRemoteAddress(request)

    // Insert Device Log and Update Ping prior to calling handler and
    // in separate transaction so it is recorded even if handler fails
    let deviceLogId = null
    let deviceLogRawMessage = null
    if (updateDeviceLog) {
      // TODO DeviceLog handle non-JSON payloads
      deviceLogRawMessage = JSON.stringify(request.plugins.rawPayload)

      logger.debug('need to ensure DeviceLog is inserted even if failure below', {
        reLabel: 'deviceApi:deviceApiHandler',
      })

      // need to ensure DeviceLog is inserted even if failure below
      ;[deviceLogId] = await knex('DeviceLog').insert({
        deviceId,
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
      context.isFastImport = isFastImport

      // update timestamps as necessary for original device
      const originalDeviceId = context.device.id
      if (!isFastImport) {
        await updateDeviceData(context, handlerOptions, remoteAddress)
      }

      // invoke delegate handler
      response = await handler(context)

      // If handler changes device (e.g. GxAlert plugin), update timestamps
      // for new device as necessary
      if (context.device.id !== originalDeviceId) {
        handlerOptions = await getHandlerOptionsFromContext(handler, context, defaultHandlerOptions)
        if (!isFastImport) {
          await updateDeviceData(context, handlerOptions, remoteAddress)
        }
      }

      // Update DeviceLog with changes added to context when calling handler
      if (deviceLogId !== null) {
        const { deviceLogUpdate } = context
        if (deviceLogUpdate != null && !isFastImport) {
          await knex('DeviceLog').where({ id: deviceLogId }).update(deviceLogUpdate)
        }
      }
    })
    return response
  })
}

async function updateDeviceData(context, handlerOptions = {}, remoteAddress) {
  const { knex, pluginNames: plugins, device, payload } = context
  const { updatePing = false } = handlerOptions

  const deviceUpdates = {}

  const getDeviceSeenOn = await loadPlugin(plugins, 'getDeviceSeenOn')
  const deviceSeenOn = await getDeviceSeenOn(context)
  if (deviceSeenOn != null) {
    logger.debug('update deviceSeenOn', {
      reLabel: 'deviceApi:updateDeviceData',
    })

    // flag as seen even if handler fails
    deviceUpdates.lastSeenOn = deviceSeenOn
    context.messageContext.dispatch(deviceSeen(device.id))
  }

  if (updatePing) {
    logger.debug('update device ping on', {
      reLabel: 'deviceApi:updateDeviceData',
    })

    const getDevicePingOn = await loadPlugin(plugins, 'getDevicePingOn')
    const devicePingOn = await getDevicePingOn(context)
    if (devicePingOn != null) {
      deviceUpdates.lastPingOn = devicePingOn
      deviceUpdates.lastPingFromIp = remoteAddress
    }
  }

  const instrumentSerial = _.get(payload, 'result.instrument.serial', null)
  if (instrumentSerial) deviceUpdates.lastInstrumentSerial = instrumentSerial

  if (!_.isEmpty(deviceUpdates)) {
    await knex('Device').where({ id: device.id }).update(deviceUpdates)
  }
}

async function addDeviceDataWithContext(context) {
  let response = {}
  const { pluginNames: plugins } = context

  logger.debug("Loading device plugin's preProcessAddDeviceData", {
    reLabel: 'deviceApi:preProcessAddDeviceData',
  })
  const preProcessAddDeviceData = await loadPlugin(plugins, 'preProcessAddDeviceData')
  logger.debug('Processing preProcessAddDeviceData', {
    reLabel: 'deviceApi:preProcessAddDeviceData',
  })
  await preProcessAddDeviceData(context)

  const { now, payload } = context
  const { configuration, includeDeviceConfiguration, log, operation, result, site, getFormsDefinition } = payload

  if (site) {
    logger.debug('executing updateSiteWithContext', {
      reLabel: 'deviceApi:updateSiteWithContext',
    })
    response = {
      ...response,
      ...(await updateSiteWithContext(context.withPayload(site))),
    }
  }

  if (configuration) {
    logger.debug('executing updateSiteWithContext', {
      reLabel: 'deviceApi:updateDeviceConfigurationWithContext',
    })
    response = {
      ...response,
      ...(await updateDeviceConfigurationWithContext(context.withPayload(configuration))),
    }
  }
  if (includeDeviceConfiguration) {
    logger.debug('executing getConnectionSettings', {
      reLabel: 'deviceApi:getConnectionSettings',
    })
    response = {
      ...response,
      ...(await getConnectionSettings(context)),
    }
  }
  if (getFormsDefinition) {
    response = {
      ...response,
      ...(await getCustomFields(context)),
    }
  }
  if (operation) {
    logger.debug('executing addDeviceOperationWithContext', {
      reLabel: 'deviceApi:addDeviceOperationWithContext',
    })
    response = {
      ...response,
      ...(await addDeviceOperationWithContext(context.withPayload(operation))),
    }
  }

  if (result) {
    logger.debug('executing mergeResultWithContext', {
      reLabel: 'deviceApi:mergeResultWithContext',
    })
    response = {
      ...response,
      ...(await mergeResultWithContext(context.withPayload(result))),
    }
  }

  if (log) {
    if (log.source === 'GeneXpert' && log.data) {
      response = {
        ...response,
        ...(await processGeneXpertLogs(context, log.data, now)),
      }
    }
  }

  return response
}

async function processGeneXpertLogs(context, data, now) {
  if (_.isString(data)) {
    data = JSON.parse(data)
  }

  /**
   * Notice section of `.try` in  `logPayload` in `endpoint.js` -
   * if single log item is posted then wrap it into the array
   */
  if (_.isPlainObject(data)) {
    data = [data]
  }

  /**
   * Process all log items one by one
   * - and return array `response.logIds` with only those id's which where processed
   * - and store in table DeviceOperation array of successfully processed items
   */
  const calibrationDeviceMaintenanceTypeId = await deviceMaintenanceTypeToId('calibration')
  const options = {
    calibrationDeviceMaintenanceTypeId,
    now,
  }

  const processedFileLogIds = []
  const processedSystemLogIds = []
  await Promise.each(data, async logItem => {
    try {
      const logItemId = await processLogItem(context, logItem, options)

      if (logItem.logFileName === 'GeneXpert DB') {
        processedSystemLogIds.push(logItemId)
      } else {
        processedFileLogIds.push(logItemId)
      }
    } catch (err) {
      /**
       * if error happened then we do not return this logId as processed,
       * meaning that it will be sent again next scheduler run
       */
      logger.error(
        `execution of processLogItem for log entry with externalId=${logItem.externalId} and deviceId=${context.device.id} has failed`,
        {
          reLabel: 'deviceApi:processLogItem',
        }
      )
    }
  })

  return {
    logIds: processedFileLogIds,
    systemLogIds: processedSystemLogIds,
  }
}

async function processLogItem(context, logItem, options) {
  const { calibrationDeviceMaintenanceTypeId, now } = options
  const { externalId, logFileName, logLevel, occurredOn } = logItem
  let { details } = logItem
  if (_.isString(details)) {
    details = JSON.parse(details)
  }
  const { device, knex } = context
  const value = `${device.id}|${externalId}|${logFileName}`
  const hash = crypto.createHash('md5').update(value).digest('hex')
  const payload = {
    id: externalId,
    startedOn: occurredOn,
    data: {
      type: 'gx-log',
      logFileName,
      logLevel,
      details,
    },
    hash,
  }

  logger.debug('executing processLogItem', {
    reLabel: 'deviceApi:processLogItem',
  })

  try {
    const { id: deviceOperationId } = await addDeviceOperation(knex, device.id, payload, now)

    // check if stored in table 'DeviceOperation' entry is
    // hardware error and dispatch MQ action if needed
    await shouldTriggerHardwareErrorAnalysis(context.messageContext, device, payload, deviceOperationId)
    // process 'calibration' log item
    await shouldLogDeviceCalibration(
      knex,
      device.id,
      payload,
      calibrationDeviceMaintenanceTypeId,
      context.messageContext
    )
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      // ignore duplicate entry errors since the same log item may come from GxAlert and GxConnect
      logger.warning(
        `got duplicated logItem. deviceId=${device.id}, externalId=${externalId}, logFileName=${logFileName}`,
        {
          reLabel: 'deviceApi:processLogItem',
        }
      )
    } else {
      throw err
    }
  }

  return logItem.externalId
}

async function getConnectionSettings(context) {
  const {
    knex,
    device: { id: deviceId, partnerId },
  } = context
  const { data } =
    (await knex('DeviceConfiguration as dc')
      .join('Geography as g', 'g.id', 'dc.geographyId')
      .join('Device as d', 'd.deviceTypeId', 'dc.deviceTypeId')
      .join('Geography as deviceGeography', 'd.geographyId', 'deviceGeography.id')
      .where({
        'd.id': deviceId,
        'd.deviceTypeId': knex.raw('dc.deviceTypeId'),
        'dc.partnerId': partnerId,
        'g.countryId': knex.raw('deviceGeography.countryId'),
      })
      .andWhere(builder =>
        builder.whereNull('d.connectSettingsSentOn').orWhere('d.connectSettingsSentOn', '<', knex.raw('dc.updatedOn'))
      )
      .andWhere(builder => {
        builder
          .whereNull('g.stateId')
          .orWhere(orBuilder =>
            orBuilder.whereNotNull('g.stateId').andWhere('g.stateId', knex.raw('deviceGeography.stateId'))
          )
      })
      .orderBy('g.stateId', 'DESC')
      .first('data')) || {}

  if (!_.isEmpty(data)) await knex('Device').update({ connectSettingsSentOn: new Date() }).where({ id: deviceId })
  return { deviceConfiguration: _.isEmpty(data) ? null : JSON.parse(data) }
}

async function getDeviceDataWithContext(context) {
  const { knex, now, device, deviceLog, deviceLogType } = context

  // include fields based on device log type configured in endpoints
  const includeAll = deviceLogType === DEVICE_LOG_TYPE_OPTIONAL
  const includeDevice = includeAll
  const includeSite = includeAll

  // only include device data if approved
  const deviceApproved = device.approval === 'approved'
  const includeConfig = deviceApproved && includeAll
  const includeOp = deviceApproved && (includeAll || deviceLogType === DEVICE_LOG_TYPE_OPERATION)

  const response = { requestedOn: now.toISOString() }
  if (includeDevice) {
    response.name = device.name
    response.approval = { id: device.approval }
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

    if (includeConfig) {
      const config = await getDeviceConfigurationFromDeviceLog(knex, deviceLog.id)
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
    messageContext,
  } = context
  const preProcess = await loadPlugin(plugins, 'preProcessUpdateDeviceConfiguration')
  await preProcess(context)

  if (!context.isFastImport) {
    await updateDeviceConfiguration(knex, deviceId, payload, now, messageContext)
  }
  context.addDeviceLogUpdate('deviceConfigurationUpdated', true)
  const postProcess = await loadPlugin(plugins, 'postProcessUpdateDeviceConfiguration')
  const postProcessResult = await postProcess(context)

  return postProcessResult
}
const getCustomFields = async context => {
  const {
    knex,
    device: { id: deviceId, partnerId },
    pluginNames: plugins,
  } = context
  let CustomFields = null
  const customFields = await loadPlugin(plugins, 'getCustomFields')
  if (customFields) CustomFields = _.get(await customFields(knex, partnerId, deviceId), 'CustomFields')
  return { CustomFields }
}

async function getDeviceOperationWithContext(context) {
  const {
    knex,
    deviceLog: { id: deviceLogId },
  } = context
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
    const approval = device.siteId == null ? 'approved' : 'assigned'
    const deviceApprovalId = await deviceApprovalToId(approval)

    await knex('Device').where({ id: device.id }).update({
      siteId: site.id,
      deviceApprovalId,
    })

    await knex('DeviceApprovalLog').insert({
      deviceId: device.id,
      deviceApprovalId,
      changedOn: now,
      createdOn: now,
      createdBy: null,
    })

    // Update DeviceApiKey site with the new siteId
    await knex('DeviceApiKey').where({ deviceId: device.id }).update({
      siteId: site.id,
    })

    await knex('DeviceSiteHistory').insert({
      deviceId: device.id,
      siteId: site.id,
      createdOn: now,
    })
  }

  const postProcessUpdateSite = await loadPlugin(plugins, 'postProcessUpdateSite')
  await postProcessUpdateSite(pluginContext, { id: site.id, externalId: siteExternalId }, { id: device.siteId })
}

async function mergeResultWithContext(context) {
  const {
    knex,
    actions,
    device: { id: deviceId, deviceType },
    pluginNames: plugins,
    payload,
    partnerId,
    now,
    messageContext,
    userId,
  } = context

  const pluginContext = {
    knex,
    deviceId,
    actions,
    deviceType,
    payload,
    partnerId,
    now,
    messageContext,
    userId,
  }

  const preProcess = await loadPlugin(plugins, 'preProcessMergeResult')
  await preProcess(pluginContext)

  const excludeResult = await loadPlugin(plugins, 'excludeResult')
  await excludeResult(pluginContext)

  const transformPayload = await loadPlugin(plugins, 'transformMergeResultPayload')
  const transformedPayload = await transformPayload(pluginContext)
  const {
    processedResult: plainResult,
    existingResult: plainPreviousResult,
    shouldTriggerResultNotification,
    // changeFlags - This is going to be used when we implement the Sample ID and Patient ID based notification
  } = await mergeResult(knex, deviceId, transformedPayload, { now })
  context.addDeviceLogUpdate('resultId', plainResult.id)
  const postProcess = await loadPlugin(plugins, 'postProcessMergeResult')
  const postProcessResult = await postProcess(pluginContext, plainResult, plainPreviousResult)

  // This is going to be used when we implement the Sample ID and Patient ID based notification
  // const result = plainToDeepObjectResult(plainResult)
  // const previousResult = plainToDeepObjectResult(plainPreviousResult)

  if (shouldTriggerResultNotification && !context.isFastImport) {
    context.messageContext.bindActionCreators({ resultReadyForNotification })
    const isResultUpdated = !!plainPreviousResult
    context.messageContext.resultReadyForNotification(plainResult.id, isResultUpdated)
  }

  return {
    ...postProcessResult,
    aspectResultId: plainResult.id,
  }
}

async function createDeviceApiContext(handler, originalRequest, defaultHandlerOptions) {
  const handlerOptions = await getHandlerOptionsFromRequest(handler, originalRequest, defaultHandlerOptions)
  const request = {
    auth: originalRequest.auth,
    params: originalRequest.params,
    payload: originalRequest.payload,
    query: originalRequest.query,
  }
  const { createDevice = false, deviceLogType = DEVICE_LOG_TYPE_NONE } = handlerOptions

  const messageContext = originalRequest.plugins.messageContext.bindActionCreators({
    resultUpdated,
  })

  const { auth } = request
  const now = new Date()

  const existingDeviceAndData = await knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
    .leftJoin('Geography as g', 'd.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
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
      'd.shortName',
      'd.serial',
      'd.macAddress',
      'd.configurationData',
      'd.connectSettingsSentOn',
      'd.lastSeenOn',
      'd.putInService',
      'da.token as approval',
      'dt.externalId as deviceType',
      'dt.plugin as deviceTypePluginName',
      'p.plugin as partnerPluginName',
      'dtc.name as deviceTypeCategory',
      'c.abbreviation as countryAbbreviation',
      'dak.token'
    )
  if (handlerOptions.transformInitialPayload && request.params.pluginName) {
    logger.debug('Set up transforminitialpayload plugin function', {
      reLabel: 'deviceApi:createDeviceApiContext',
    })
    const transformInitialPayload = await loadPlugin([request.params.pluginName], 'transformInitialPayload')

    if (existingDeviceAndData && existingDeviceAndData.countryAbbreviation) {
      logger.debug('Transforming the payload base on the function plugin', {
        reLabel: 'deviceApi:createDeviceApiContext',
      })
      request.payload = await transformInitialPayload(originalRequest, existingDeviceAndData.countryAbbreviation)
    } else request.payload = await transformInitialPayload(originalRequest)
  }

  let device = null
  if (existingDeviceAndData != null) {
    device = existingDeviceAndData
  } else if (createDevice) {
    const deviceAndError = await createNewDeviceFromRequest(request, now)
    if (deviceAndError.error) {
      return deviceAndError
    }
    ;({ device } = deviceAndError)

    await sendNotificationToContacts(originalRequest.payload, device)
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

  let { id: userId } = (await getUser(auth.credentials.name)) || {}
  if (!userId) {
    ;({ createdBy: userId } = await knex('Device').where('id', device.id).first('createdBy'))
  }

  const context = new DeviceApiContext({
    auth,
    userId,
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
    const { resultId } = request.query

    if (existingDeviceAndData == null) {
      // We will only have a device log if we already had a device
      return { error: Boom.notFound('Device does not have data.') }
    }

    // return last one for this device
    const lastDeviceLogQuery = knex('DeviceLog as dl')
      .where({ 'dl.deviceId': device.id })
      .orderBy('dl.id', 'desc')
      .first('dl.id', 'dl.resultId', 'dl.createdOn', 'dl.source')
    if (deviceLogType === DEVICE_LOG_TYPE_RESULT) {
      lastDeviceLogQuery.modify(addDeviceLogResultConstraints)
      if (resultId) {
        lastDeviceLogQuery.where({ 'r.externalId': resultId })
      }
    } else if (deviceLogType === DEVICE_LOG_TYPE_OPERATION) {
      lastDeviceLogQuery.whereNotNull('dl.deviceOperationId')
    }
    const lastDeviceLog = await lastDeviceLogQuery
    context.deviceLog = lastDeviceLog || null

    return {
      error: lastDeviceLog == null && Boom.notFound('Cannot find Logs records for the specific device'),
      context,
    }
  }

  // finally, all is well
  return { context }
}

function createNewDeviceFromRequest(request, now) {
  return transact(async knex => {
    const { auth } = request
    logger.debug('Create new device from request', {
      reLabel: 'deviceApi:createNewDeviceFromRequest',
    })
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
        error: Boom.notFound('Cannot find available API Key when creating new device'),
      }
    }
    const deviceTypePlugin = await deviceTypeToPlugin(_.get(request, 'payload.type.id'))
    const apiKey = _.assign({}, partnerApiKey, {
      plugins: [_.get(partnerApiKey, 'plugin'), deviceTypePlugin],
    })

    // Require Device Type when creating device
    const transformNewDevicePayload = await loadPlugin(apiKey.plugins, 'transformNewDevicePayload')
    const payload = await transformNewDevicePayload({
      payload: request.payload,
    })

    const preProcessCreateDevice = await loadPlugin(apiKey.plugins, 'preProcessCreateDevice')
    const existingDevice = await preProcessCreateDevice(request, now)

    if (!_.isEmpty(existingDevice)) {
      return { device: existingDevice }
    }

    const deviceTypeExternalId = _.get(payload, 'type.id', null)
    if (deviceTypeExternalId == null) {
      return {
        error: Boom.badRequest('Must specify device type on first request with new key'),
      }
    }

    const siteExternalId = _.get(payload, 'site.id', null)
    let defaultSite = {}
    logger.debug(siteExternalId && !apiKey.geographyId && !apiKey.siteId, {
      reLabel: 'deviceApi:createNewDevice',
    })
    if (siteExternalId && !apiKey.geographyId && !apiKey.siteId)
      defaultSite = await knex('Site as s').where('externalId', siteExternalId).first()
    const { device, error } = await createNewDevice(knex, now, {
      deviceTypeExternalId,
      name: payload.name,
      serial: payload.serial,
      partnerId: apiKey.partnerId,
      siteId: apiKey.siteId || _.get(defaultSite, 'id', null),
      geographyId: apiKey.geographyId || _.get(defaultSite, 'geographyId', null),
      approval: apiKey.siteId ? 'approved' : 'provisioned',
      timezone: _.get(payload, 'configuration.data.timezone', null),
    })
    logger.debug('Assign new device an api key', {
      reLabel: 'deviceApi:createNewDeviceFromRequest',
    })
    // Assign new device to API Key
    await knex('DeviceApiKey').where({ id: apiKey.id }).update({ deviceId: device.id, updatedOn: now })

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
    return new DeviceApiContext({ ...this, payload, parent: this })
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

function addDeviceLogResultConstraints(queryBuilder) {
  queryBuilder
    .join('Result as r', 'dl.resultId', 'r.id')
    .join('ResultWorkflowLog as resultworkflowsl', 'r.resultWorkflowStatusLogId', 'resultworkflowsl.id')
    .join('ResultWorkflowStatus as rws', 'resultworkflowsl.resultWorkflowStatusId', 'rws.id')
    .where('rws.externalId', 'Deliverable')
    .where('rws.externalId', '<>', 'Purged')
}

async function onResultUpdated({ resultId, deviceLogId, userId }, { messageContext }) {
  if (!resultId) {
    throw new Error('Must specify resultId in Action')
  }
  const context = messageContext.bindActionCreators({ resultLogged })
  if (deviceLogId) {
    // we've already created device logs originating here, so ignore
    return context.resultLogged(resultId, deviceLogId, userId, { isResultUpdated: true })
  }
  return context.transact(async knex => {
    logger.debug(`onResultUpdated inserting in DeviceLog table for resultId:${resultId}`, {
      reLabel: 'deviceApi:onResultUpdated',
    })
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
    context.resultLogged(resultId, deviceLogId, userId, { isResultUpdated: true })
  })
}

async function onResultLogged(action, context) {
  return context.messageContext.run(async knex => {
    const { partnerPluginName, deviceTypePluginName } =
      (await knex('Result as r')
        .leftJoin('Partner as p', 'r.partnerId', 'p.id')
        .leftJoin('Device as d', 'r.deviceId', 'd.id')
        .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .where({ 'r.id': action.resultId })
        .first('p.plugin as partnerPluginName', 'dt.plugin as deviceTypePluginName')) || {}
    logger.debug(
      [
        `onResultLogged locating the plugin function on resultId:${action.resultId} for partnerPlugin:${partnerPluginName} or devicePlugin:${deviceTypePluginName}`,
      ],
      {
        reLabel: 'deviceApi:onResultLogged',
      }
    )
    const pluginOnResultLogged = await loadPlugin([partnerPluginName, deviceTypePluginName], 'onResultLogged')
    await pluginOnResultLogged(action, context)
    context.messageContext.queue.dispatch(resultLoggedProcessed(action.resultId, action.deviceLogId), undefined, {
      expiration: 60000,
    })
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
    senderIp: getRemoteAddress(request),
    rawMessage: JSON.stringify(request.plugins.rawPayload),
  })
}

async function getDevicesByCountry(knex) {
  return knex('Device as d')
    .join('Geography as g', 'd.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .select(
      'c.abbreviation as A2',
      'c.a3 as A3',
      'c.name as Country',
      knex.raw("date(date_format(d.createdOn,'%Y-%m-01')) as Date")
    )
    .count('d.id as Total')
    .groupBy('c.abbreviation', 'c.a3', 'c.name', 'Date')
    .orderBy('Date', 'asc')
}

async function getTestByCountry(knex) {
  return knex('Device as d')
    .join('Geography as g', 'd.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .leftJoin('Result as r', 'd.id', 'r.deviceId')
    .select(
      'c.abbreviation as A2',
      'c.a3 as A3',
      'c.name as Country',
      knex.raw("date(date_format(r.createdOn,'%Y-%m-01')) as Date")
    )
    .count('r.id as Total')
    .groupBy('c.abbreviation', 'c.a3', 'c.name', 'Date')
    .orderBy('Date', 'asc')
}

async function getNotificationsByCountry(knex) {
  return knex('Device as d')
    .join('Geography as g', 'd.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .leftJoin('Issue as i', 'd.id', 'i.deviceId')
    .leftJoin('Notification as n', 'i.id', 'n.issueId')
    .select(
      'c.abbreviation as a2',
      'c.a3 as A3',
      'c.name as Country',
      knex.raw("date(date_format(n.createdOn,'%Y-%m-01')) as Date"),
      knex.raw('sum(case when emailMessageId  is not null then 1 else 0 end) as Email '),
      knex.raw('sum(case when smsMessageId is not null then 1 else 0 end) as Sms ')
    )
    .groupBy('c.abbreviation', 'c.a3', 'c.name', 'Date')
    .orderBy('Date', 'asc')
}

async function getCountriesHealthStats(knex) {
  return knex('Device as d')
    .join('Geography as g', 'd.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .select('c.abbreviation as a2', 'c.a3 as A3', 'c.name as Country')
    .min('d.createdOn as Date')
    .count('d.id as Total')
    .groupBy('c.abbreviation', 'c.a3', 'c.name')
    .orderBy('Date', 'asc')
}
const getHealthStatsHandler = deviceApiHandler(getHealthState)

async function getHealthState(context) {
  const countries = await getCountriesHealthStats(context.knex)
  const devices = await getDevicesByCountry(context.knex)
  const tests = await getTestByCountry(context.knex)
  const notifications = await getNotificationsByCountry(context.knex)
  const result = {
    Countries: countries,
    Devices: devices,
    Tests: tests,
    Notifications: _.map(notifications, item => ({
      Country: item.Country,
      A2: item.A2,
      A3: item.A3,
      Date: item.Date,
      Sms: item.Sms,
      Email: item.Email,
      Total: item.Sms + item.Email,
    })),
  }
  return result
}

async function sendNotificationToContacts(payload, device) {
  const { configuration } = payload
  if (configuration && configuration.data) {
    const configurationData = configuration.data
    const { culture, routerNumber, noInventory } = configurationData
    const labContact = {
      name: configurationData.labContactName,
      email: configurationData.labContactEmail,
      cell: configurationData.labContactCell,
    }

    const installerContact = {
      name: configurationData.installerName,
      email: configurationData.installerEmail,
      cell: configurationData.installerCell,
    }

    const { operation } = payload
    let cartridgeCount = null
    if (operation && operation.data && operation.data.inventoryChanges && operation.data.inventoryChanges.length > 0) {
      cartridgeCount = operation.data.inventoryChanges.reduce(
        (accumulator, inventoryChange) => accumulator + inventoryChange.quantity,
        0
      )
    }

    await Promise.all([
      notifyPerson(labContact, device.name, routerNumber, noInventory, culture, cartridgeCount),
      notifyPerson(installerContact, device.name, routerNumber, noInventory, culture, cartridgeCount),
    ])
  }
}

async function notifyPerson({ name, email, cell }, deviceName, routerNumber, noInventory, culture, cartridgeCount) {
  const generatedTemplate = await templateProcessor.process(
    'newDevice',
    {
      deviceName,
      name,
      routerNumber,
      noInventory,
      cartridgeCount,
    },
    culture
  )

  if (email) {
    const inlineImageAttachments = await templateProcessor.getInlineImageAttachments(generatedTemplate.html)

    await sendEmail(
      email,
      generatedTemplate.subject,
      generatedTemplate.html,
      generatedTemplate.text,
      inlineImageAttachments
    ).catch(err => logger.error(err))
  }

  if (cell) {
    await sendSms(cell, generatedTemplate.text).catch(err => logger.error(err))
  }
}

module.exports = {
  getDeviceDataHandler,
  getDeviceOperationHandler,
  getResultHandler,
  addDeviceDataHandler,
  addDeviceDataFastHandler,
  addPluginDeviceDataHandler,
  updateDeviceConfigurationHandler,
  addDeviceOperationHandler,
  mergeResultHandler,
  addDeviceLog,
  onResultUpdated,
  onResultLogged,
  getHealthStatsHandler,
  getCustomFields,
  getResultPakistanHandler,
}
