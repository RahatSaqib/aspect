const _ = require('lodash')
const Boom = require('@hapi/boom')
const { knex, transact } = require('../db')
const { deviceApprovalToId } = require('../shared/dictionary')
const { deviceSeen } = require('../device/actions')
const { loadPlugin } = require('../plugin/loadPlugin')
const { resultUpdated, resultReadyForNotification } = require('../result/actions')
const { mergeResult } = require('./mergeResult')
const { addDeviceLogUpdate } = require('./deviceContext')
const { sendNotificationToContacts } = require('./deviceContext/sendNotificationToContacts')
const { findOpenModuleDisabledIssues } = require('../issue/common/db')
const { resolveIssues } = require('../issue/actions')
const { consumeInventoryForResult } = require('../inventory/consumeInventoryForResult')
const { resultAutoTagging } = require('./result')

const processResultPayload = async (request, deviceLogId, remoteAddress) => {
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
  const instrumentSerial = payload?.result?.instrument?.serial || payload?.result?.instrumentSerial

  // Create context for processing payload
  const context = {
    defaultTimeZone,
    auth,
    now: new Date(),
    instrumentSerial,
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

  const response = await knex.transaction(async trx => {
    context.knex = trx

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

    // TODO: Remove withPayload function
    const { aspectResultId } = await mergeResultWithContext(context)

    // Update DeviceLog with changes added to context when calling handler
    await trx('DeviceLog')
      .where('id', deviceLogId)
      .update({
        ...context.deviceLogUpdate, // addDeviceLogUpdate may have added more fields to update
        deviceId: context.device.id,
        processed: true,
      })

    return { aspectResultId, device: { id: context.device.id } }
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

async function mergeResultWithContext(context) {
  const { knex, partnerPluginName, deviceTypePluginName, payload, messageContext } = context

  const preProcessMergeResult = await loadPlugin(partnerPluginName, deviceTypePluginName, 'preProcessMergeResult')
  await preProcessMergeResult(context)

  const excludeResult = await loadPlugin(partnerPluginName, deviceTypePluginName, 'excludeResult')
  await excludeResult(context)

  const transformMergeResultPayload = await loadPlugin(
    partnerPluginName,
    deviceTypePluginName,
    'transformMergeResultPayload'
  )
  await transformMergeResultPayload(context)

  const {
    processedResult: plainResult,
    existingResult: plainPreviousResult,
    shouldTriggerResultNotification,
    // changeFlags - This is going to be used when we implement the Sample ID and Patient ID based notification
  } = await mergeResult(context)
  addDeviceLogUpdate(context, 'resultId', plainResult.id)

  await resultAutoTagging(knex, plainResult)

  // consumeInventoryForResult
  if (plainResult.siteId) {
    const consumablesInResultData = _.isEmpty(payload.consumable) ? [] : payload.consumable

    await consumeInventoryForResult({
      knex,
      resultId: plainResult.id,
      assayId: plainResult.assayId,
      siteId: plainResult.siteId,
      lotNumber: consumablesInResultData[0]?.lot,
      expirationDate: consumablesInResultData[0]?.expirationDate,
      partnerId: plainResult.partnerId,
      testStartedOn: plainResult.startedOn,
      messageContext,
    })
  }

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
      deviceApiKeyId: context.auth.credentials.deviceApiKeyId,
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
  processResultPayload,
}
