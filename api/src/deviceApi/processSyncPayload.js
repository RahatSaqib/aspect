const _ = require('lodash')
const Boom = require('@hapi/boom')
const Promise = require('bluebird')
const crypto = require('crypto')
const { knex, transact } = require('../db')
const { deviceApprovalToId, deviceMaintenanceTypeToId } = require('../shared/dictionary')
const { deviceSeen, cepheidc360InstrumentLogsReceived } = require('../device/actions')
const { loadPlugin } = require('../plugin/loadPlugin')
const { shouldTriggerHardwareErrorAnalysis, shouldLogDeviceCalibration } = require('../plugin/utils')
const logger = require('../shared/logger')
const { resultUpdated, resultReadyForNotification } = require('../result/actions')
const { updateDeviceConfiguration, addDeviceOperation } = require('./device')
const { mergeResult } = require('./mergeResult')
const { withPayload, addDeviceLogUpdate } = require('./deviceContext')
const { sendNotificationToContacts } = require('./deviceContext/sendNotificationToContacts')
const { findOpenModuleDisabledIssues } = require('../issue/common/db')
const { resolveIssues } = require('../issue/actions')

const processSyncPayload = async (request, deviceLogId, remoteAddress) => {
  const { auth, payload } = request
  const messageContext = request.plugins.messageContext.bindActionCreators({
    resultUpdated,
  })

  // Get plugin names for device resolution
  const { id: deviceTypeExternalId } = payload?.type ?? {}
  const { partnerPluginName, deviceTypePluginName, deviceTypeId, partnerId, defaultTimeZone } =
    await getPartnerAndDeviceTypePlugins({
      token: auth.credentials.token,
      deviceTypeExternalId,
      country: _.get(payload, 'configuration.data.country', null),
    })

  if (deviceTypeId == null) {
    return {
      error: Boom.badRequest(`Cannot find DeviceType with externalId ${deviceTypeExternalId}`),
    }
  }

  // Create context for processing payload
  const context = {
    defaultTimeZone,
    auth,
    now: new Date(),
    payload: request.payload,
    query: request.query,
    messageContext,
    partnerId,
    partnerPluginName,
    deviceTypePluginName,
    actions: {},
    deviceTypeId,
    deviceLogId,
  }

  // Try to resolve device via identifyDevice plugin (e.g. gxConnect)
  const identifyDevice = await loadPlugin(partnerPluginName, deviceTypePluginName, 'identifyDevice')
  context.device = await identifyDevice(payload, partnerId)

  const response = await context.messageContext.transact(async knex => {
    context.knex = knex

    // If device not found, try to create it
    if (!context.device) {
      context.device = await createDevice(context)

      const postProcessCreateDevice = await loadPlugin(
        partnerPluginName,
        deviceTypePluginName,
        'postProcessCreateDevice'
      )
      await postProcessCreateDevice(context)
    }

    // TODO: this should be only in case of existing device, and for the new one maybe just send the event deviceSeen
    // Update lastSeenOn and lastPingOn even if handler fails
    await updateDeviceTimestamps(context, remoteAddress)

    // invoke delegate handler
    const response = await processPayload(context)

    // Update DeviceLog with changes added to context when calling handler
    await knex('DeviceLog')
      .where('id', deviceLogId)
      .update({
        ...context.deviceLogUpdate, // addDeviceLogUpdate may have added more fields to update
        deviceId: context.device.id,
        processed: true,
      })

    return response
  })

  return response
}

async function updateDeviceTimestamps(context, remoteAddress) {
  const { knex, now, device } = context

  await knex('Device')
    .where({ id: device.id })
    .update({ lastSeenOn: now, lastPingOn: now, lastPingFromIp: remoteAddress, updatedOn: now })

  context.messageContext.dispatch(deviceSeen(device.id))
}

async function processPayload(context) {
  const { payload } = context

  const handlers = [
    {
      name: 'updateDeviceConfigurationWithContext',
      when: payload.configuration,
      run: () => updateDeviceConfigurationWithContext(withPayload(context, payload.configuration)),
    },
    {
      name: 'getConnectionSettings',
      when: payload.includeDeviceConfiguration,
      run: () => getConnectionSettings(context),
    },
    {
      name: 'getCustomFields',
      when: payload.getFormsDefinition,
      run: () => getCustomFields(context),
    },
    {
      name: 'addDeviceOperationWithContext',
      when: payload.operation,
      run: () => addDeviceOperationWithContext(withPayload(context, payload.operation)),
    },
    {
      name: 'mergeResultWithContext',
      when: payload.result,
      run: () => mergeResultWithContext(withPayload(context, payload.result)),
    },
    {
      name: 'processGeneXpertLogs',
      when: payload.log?.source === 'GeneXpert' && payload.log?.data, // TODO this logic should be in a plugin
      run: () => processGeneXpertLogs(context, payload.log.data),
    },
  ]

  let response = {}
  for (const handler of handlers) {
    // eslint-disable-next-line no-continue
    if (!handler.when) continue

    if (handler.name) {
      logger.debug(`executing ${handler.name}`)
    }

    response = {
      ...response,
      // eslint-disable-next-line no-await-in-loop
      ...(await handler.run()),
    }
  }

  // TODO: Remove in future
  // GxConnect does not require any data in the result response.
  // However, we decided to retain the aspectResultId and the device.id in the response to aid in troubleshooting.
  // In the future, we plan to remove it to enable asynchronous result processing.
  // The device object is removed to minimize network data usage.
  if (payload.result) {
    const { device, ...restOfResponse } = response
    response = { ...restOfResponse, device: { id: device.id } }
  }

  return response
}

async function processGeneXpertLogs(context, data) {
  const { now } = context

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
  addDeviceLogUpdate(context, 'deviceOperationId', op.id)

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

  await updateDeviceConfiguration(knex, deviceId, payload, now, messageContext)
  addDeviceLogUpdate(context, 'deviceConfigurationUpdated', true)
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
  addDeviceLogUpdate(context, 'resultId', plainResult.id)
  const postProcess = await loadPlugin(partnerPluginName, deviceTypePluginName, 'postProcessMergeResult')
  const postProcessResult = await postProcess(pluginContext, plainResult, plainPreviousResult)

  // This is going to be used when we implement the Sample ID and Patient ID based notification
  // const result = plainToDeepObjectResult(plainResult)
  // const previousResult = plainToDeepObjectResult(plainPreviousResult)

  if (shouldTriggerResultNotification) {
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

async function getPartnerAndDeviceTypePlugins({ token, deviceTypeExternalId, country }) {
  return (
    (await knex
      .from('DeviceApiKey as dak')
      .leftJoin('Partner as p', 'p.id', 'dak.partnerId')
      .where('dak.token', token)
      .first({
        partnerPluginName: 'p.plugin',
        partnerId: 'dak.partnerId',
        deviceTypeId: knex('DeviceType as dt').select('dt.id').where('dt.externalId', deviceTypeExternalId),
        deviceTypePluginName: knex('DeviceType as dt').select('dt.plugin').where('dt.externalId', deviceTypeExternalId),
        defaultTimeZone: knex('Country as c').select('c.timezone').where('c.name', country),
      })) || {}
  )
}

async function generateDeviceName(context, serial) {
  const { payload, partnerId, deviceTypeId, deviceTypeExternalId } = context
  const { name } = payload

  if (!name) {
    if (serial) {
      return serial
    }

    const [deviceCount] = await knex('Device')
      .where({
        partnerId,
        deviceTypeId,
      })
      .count('id as cnt')
    return `${deviceTypeExternalId} #${deviceCount.cnt + 1}`
  }

  return name
}

/**
 * Creates a new device from the request payload.
 */
async function createDevice(context) {
  const { payload, now, deviceTypeId, deviceTypeExternalId, partnerId, defaultTimeZone } = context
  const hostId = _.get(payload, 'configuration.data.hostId', null) || payload.hostId
  const serial = _.get(payload, 'configuration.data.deviceSerialNumber') || payload.serial
  const macAddress = _.get(payload, 'configuration.data.macAddress') || payload.macAddress

  // Use or generate device name
  const name = await generateDeviceName(context, serial)
  const shortName = name.substr(0, 45)

  return transact(async trx => {
    const deviceApprovalId = await deviceApprovalToId('provisioned')

    const partnerData = await trx('Partner').where({ id: partnerId }).first('deviceCapacityFactor')

    const [deviceId] = await trx('Device').insert({
      partnerId,
      deviceTypeId,
      dailyTestCapacity: deviceTypeExternalId === 'CepheidGeneXpert' ? partnerData.deviceCapacityFactor * 4 : null, // for CepheidGeneXpert we are using module=4
      moduleBayCapacity: deviceTypeExternalId === 'CepheidGeneXpert' ? 4 : 0,
      deviceApprovalId,
      name,
      serial,
      shortName,
      macAddress,
      hostId,
      timezone: defaultTimeZone, // For now we ignore this _.get(payload, 'configuration.data.timezone', null)
      configurationData: '{}',
      putInService: now, // TODO?
      lastSeenOn: now,
      lastPingOn: now,
      createdOn: now,
      updatedOn: now,
    })
    await trx('DeviceApprovalLog').insert({
      deviceId,
      deviceApprovalId,
      changedOn: now,
      createdOn: now,
      createdBy: null,
    })
    const device = await trx('Device as d')
      .leftJoin('Site as s', 'd.siteId', 's.id')
      .join('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .leftJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
      .leftJoin('Partner as p', 'd.partnerId', 'p.id')
      .where('d.id', deviceId)
      // TODO: this proyection should be the same as identifyDevice
      .first(
        'd.id',
        'd.partnerId',
        'd.siteId',
        's.geographyId',
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
        'dtc.name as deviceTypeCategory'
      )

    // TODO: Refactor this to an event
    // Send notifications
    await sendNotificationToContacts(payload, device)

    return device
  })
}

module.exports = {
  processSyncPayload,
}
