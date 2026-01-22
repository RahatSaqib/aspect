const Boom = require('@hapi/boom')
const _ = require('lodash')
const Promise = require('bluebird')

const crypto = require('crypto')
const { deviceApprovalToId, deviceMaintenanceTypeToId } = require('../shared/dictionary')
const { resultLogged, resultLoggedProcessed, resultReadyForNotification } = require('../result/actions')
const { cepheidc360InstrumentLogsReceived } = require('../device/actions')

const { updateDeviceConfiguration, addDeviceOperation } = require('./device')
const { mergeResult } = require('./mergeResult')
const { loadPlugin } = require('../plugin/loadPlugin')
const { shouldTriggerHardwareErrorAnalysis, shouldLogDeviceCalibration } = require('../plugin/utils')
const logger = require('../shared/logger')

const { findOpenModuleDisabledIssues } = require('../issue/common/db')
const { resolveIssues } = require('../issue/actions')

async function addDeviceDataWithContext(context) {
  let response = {}
  const { partnerPluginName, deviceTypePluginName } = context

  logger.debug("Loading device plugin's preProcessAddDeviceData", {
    reLabel: 'deviceApi:preProcessAddDeviceData',
  })
  const preProcessAddDeviceData = await loadPlugin(partnerPluginName, deviceTypePluginName, 'preProcessAddDeviceData')
  logger.debug('Processing preProcessAddDeviceData', {
    reLabel: 'deviceApi:preProcessAddDeviceData',
  })
  await preProcessAddDeviceData(context)
  const transformMergeResultResponse = await loadPlugin(
    partnerPluginName,
    deviceTypePluginName,
    'transformMergeResultResponse'
  )

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
    response = transformMergeResultResponse(response)
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

    if (payload.data.logFileName === 'GeneXpert DB') {
      if (!context.messageContext.cepheidc360InstrumentLogsReceived) {
        context.messageContext = context.messageContext.bindActionCreators({
          cepheidc360InstrumentLogsReceived,
        })
      }
      context.messageContext.cepheidc360InstrumentLogsReceived(device.id, deviceOperationId)
    }
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
      .join('Site as s', 'd.siteId', 's.id')
      .join('Geography as deviceGeography', 's.geographyId', 'deviceGeography.id')
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

async function addDeviceOperationWithContext(context) {
  const {
    knex,
    payload,
    device: { id: deviceId },
    now,
    partnerPluginName,
    deviceTypePluginName,
  } = context
  const op = await addDeviceOperation(knex, deviceId, payload, now)
  context.addDeviceLogUpdate('deviceOperationId', op.id)

  const postProcess = await loadPlugin(partnerPluginName, deviceTypePluginName, 'postProcessAddDeviceOperation')
  const postProcessResult = await postProcess(context)
  return postProcessResult
}

async function updateDeviceConfigurationWithContext(context) {
  const {
    knex,
    payload,
    device: { id: deviceId },
    now,
    partnerPluginName,
    deviceTypePluginName,
    messageContext,
  } = context
  const preProcess = await loadPlugin(partnerPluginName, deviceTypePluginName, 'preProcessUpdateDeviceConfiguration')
  await preProcess(context)

  if (!context.isFastImport) {
    await updateDeviceConfiguration(knex, deviceId, payload, now, messageContext)
  }
  context.addDeviceLogUpdate('deviceConfigurationUpdated', true)
  const postProcess = await loadPlugin(partnerPluginName, deviceTypePluginName, 'postProcessUpdateDeviceConfiguration')
  const postProcessResult = await postProcess(context)

  return postProcessResult
}
const getCustomFields = async context => {
  const {
    knex,
    device: { id: deviceId, partnerId },
    partnerPluginName,
    deviceTypePluginName,
  } = context
  let CustomFields = null
  const customFields = await loadPlugin(partnerPluginName, deviceTypePluginName, 'getCustomFields')
  if (customFields) CustomFields = _.get(await customFields(knex, partnerId, deviceId), 'CustomFields')
  return { CustomFields }
}

async function updateSiteWithContext(context) {
  const { knex, actions, device, payload, now, partnerPluginName, deviceTypePluginName } = context

  const pluginContext = {
    knex,
    actions,
    payload,
    now,
    deviceType: device.deviceType,
    deviceId: device.id,
  }

  const preProcessUpdateSite = await loadPlugin(partnerPluginName, deviceTypePluginName, 'preProcessUpdateSite')
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

  const postProcessUpdateSite = await loadPlugin(partnerPluginName, deviceTypePluginName, 'postProcessUpdateSite')
  await postProcessUpdateSite(pluginContext, { id: site.id, externalId: siteExternalId }, { id: device.siteId })
}

async function mergeResultWithContext(context) {
  const {
    knex,
    actions,
    device: { id: deviceId, deviceType },
    partnerPluginName,
    deviceTypePluginName,
    payload,
    partnerId,
    now,
    messageContext,
    userId,
  } = context

  const { findResult } = await loadPlugin(partnerPluginName, deviceTypePluginName, 'findResult')
  // logger.debug('Processing findresult', {
  //   reLabel: 'deviceApi:findResult',
  // })

  const extractCustomFieldsFromPayload = await loadPlugin(
    partnerPluginName,
    deviceTypePluginName,
    'extractCustomFieldsFromPayload'
  )

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
    findResult,
    extractCustomFieldsFromPayload,
  }

  const preProcess = await loadPlugin(partnerPluginName, deviceTypePluginName, 'preProcessMergeResult')
  await preProcess(pluginContext)

  const excludeResult = await loadPlugin(partnerPluginName, deviceTypePluginName, 'excludeResult')
  await excludeResult(pluginContext)

  const transformPayload = await loadPlugin(partnerPluginName, deviceTypePluginName, 'transformMergeResultPayload')
  const transformedPayload = await transformPayload(pluginContext)
  const {
    processedResult: plainResult,
    existingResult: plainPreviousResult,
    shouldTriggerResultNotification,
    // changeFlags - This is going to be used when we implement the Sample ID and Patient ID based notification
  } = await mergeResult(knex, deviceId, transformedPayload, { now }, pluginContext)
  context.addDeviceLogUpdate('resultId', plainResult.id)
  const postProcess = await loadPlugin(partnerPluginName, deviceTypePluginName, 'postProcessMergeResult')
  const postProcessResult = await postProcess(pluginContext, plainResult, plainPreviousResult)

  // This is going to be used when we implement the Sample ID and Patient ID based notification
  // const result = plainToDeepObjectResult(plainResult)
  // const previousResult = plainToDeepObjectResult(plainPreviousResult)

  if (shouldTriggerResultNotification && !context.isFastImport) {
    context.messageContext.bindActionCreators({ resultReadyForNotification })
    const isResultUpdated = !!plainPreviousResult
    context.messageContext.resultReadyForNotification(plainResult.id, isResultUpdated)
  }
  if (plainResult?.moduleSerial && plainResult?.deviceId) {
    const openModuleDisabledIssuesByModuleSerial = await findOpenModuleDisabledIssues(
      knex,
      plainResult.deviceId,
      plainResult.moduleSerial
    )

    if (openModuleDisabledIssuesByModuleSerial.length > 0) {
      context.messageContext.bindActionCreators({ resolveIssues })
      openModuleDisabledIssuesByModuleSerial.map(issue => context.messageContext.resolveIssues(issue.id))
    }
  }

  return {
    ...postProcessResult,
    aspectResultId: plainResult.id,
  }
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
    const pluginOnResultLogged = await loadPlugin(partnerPluginName, deviceTypePluginName, 'onResultLogged')
    await pluginOnResultLogged(action, context)
    context.messageContext.queue.dispatch(resultLoggedProcessed(action.resultId, action.deviceLogId), undefined, {
      expiration: 60000,
    })
  })
}

module.exports = {
  onResultUpdated,
  onResultLogged,
  getCustomFields,
  addDeviceDataWithContext,
}
