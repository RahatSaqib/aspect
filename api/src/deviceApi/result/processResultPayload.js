const _ = require('lodash')
const Boom = require('@hapi/boom')
const { knex } = require('../../db')
const { deviceApprovalToId } = require('../../shared/dictionary')
const { syncDeviceApprovalFromDeployments } = require('../../device/common/deviceApprovalService')
const { assignGeneratedDeviceName } = require('../../device/common/deviceNaming')
const { deviceSeen } = require('../../device/actions')
const { loadPlugin } = require('../../plugin/loadPlugin')
const { resultReadyForNotification, resultLogged } = require('../../result/actions')
const { mergeResult } = require('./mergeResult')
const { findOpenModuleDisabledIssues } = require('../../issue/common/db')
const { resolveIssues } = require('../../issue/actions')
const { consumeInventoryForResult } = require('../../inventory/consumeInventoryForResult')
const { resultAutoTagging } = require('./result')
const { updateDeviceConfiguration } = require('../payloadHandlers/shared/logic')
const logger = require('../../shared/logger')
const { sendSms } = require('../../sms/smsUtil')
const { sendEmail } = require('../../email/emailUtil')
const templateProcessor = require('../../email/templateProcessor')

const processResultPayload = async (request, deviceLogId, remoteAddress) => {
  const {
    auth,
    payload,
    plugins: { messageContext },
  } = request

  const { deviceIds } = auth.credentials

  if (payload.configuration) {
    await updateDeviceConfiguration({ knex, payload, deviceIds, messageContext, remoteAddress })
  }

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

  const { shouldTriggerResultNotification, isResultUpdated, resultId, moduleSerialForIssueResolution } =
    await knex.transaction(async trx => {
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

      const {
        shouldTriggerResultNotification: shouldTriggerNotification,
        isResultUpdated: isUpdated,
        resultId,
        moduleSerial,
      } = await mergeResultWithContext(context)

      // Update DeviceLog
      await trx('DeviceLog').where('id', deviceLogId).update({
        deviceConfigurationUpdated: true,
        resultId,
        processed: true,
      })

      return {
        shouldTriggerResultNotification: shouldTriggerNotification,
        isResultUpdated: isUpdated,
        resultId,
        moduleSerialForIssueResolution: moduleSerial,
      }
    })

  // Dispatch after transaction commits so consumers see the result row
  messageContext.bindActionCreators({ resultLogged })
  messageContext.resultLogged(resultId, deviceLogId, null, { isResultUpdated: true })

  if (shouldTriggerResultNotification) {
    context.messageContext.bindActionCreators({ resultReadyForNotification })
    context.messageContext.resultReadyForNotification(resultId, isResultUpdated)
  }
  if (moduleSerialForIssueResolution && context.device.id) {
    const openModuleDisabledIssuesByModuleSerial = await findOpenModuleDisabledIssues(
      knex,
      context.device.id,
      moduleSerialForIssueResolution
    )

    if (openModuleDisabledIssuesByModuleSerial.length > 0) {
      context.messageContext.bindActionCreators({ resolveIssues })
      openModuleDisabledIssuesByModuleSerial.map(issue => context.messageContext.resolveIssues(issue.id))
    }
  }

  return { aspectResultId: resultId, device: { id: context.device.id } }
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

  // TODO: move this logic to preProcessMergeResult
  const transformMergeResultPayload = await loadPlugin(
    partnerPluginName,
    deviceTypePluginName,
    'transformMergeResultPayload'
  )
  await transformMergeResultPayload(context)

  if (context.ignoreResultPayload) {
    return {
      resultId: context.existingResultId,
    }
  }

  const {
    processedResult: plainResult,
    existingResult: plainPreviousResult,
    shouldTriggerResultNotification,
    // changeFlags - This is going to be used when we implement the Sample ID and Patient ID based notification
  } = await mergeResult(context)

  await resultAutoTagging(knex, plainResult)

  // consumeInventoryForResult
  if (plainResult.siteId) {
    const consumablesInResultData = _.isEmpty(payload.result.consumable) ? [] : payload.result.consumable

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

  return {
    shouldTriggerResultNotification,
    isResultUpdated: !!plainPreviousResult,
    resultId: plainResult.id,
    moduleSerial: plainResult.moduleSerial,
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

/**
 * Creates a new device from the request payload.
 */
async function createDevice(context) {
  const { payload, now, deviceTypeId, deviceTypeExternalId, partnerId, defaultTimeZone, knex } = context
  const hostId = _.get(payload, 'configuration.data.hostId', null) || payload.hostId
  const serial = _.get(payload, 'configuration.data.deviceSerialNumber') || payload.serial
  const macAddress = _.get(payload, 'configuration.data.macAddress') || payload.macAddress

  // Temporary non-null placeholder; the real name is generated after insert
  // (it depends on the auto-increment Device.id) via the device-naming plugin.
  const placeholderName = (serial || hostId || deviceTypeExternalId || 'device').substr(0, 45)

  const deviceApprovalId = await deviceApprovalToId('pendingDeployment')
  const deviceApiKey = await knex('DeviceApiKey')
    .where({ id: context.auth.credentials.deviceApiKeyId })
    .first('id', 'siteId')

  const partnerData = await knex('Partner').where({ id: partnerId }).first('deviceCapacityFactor')

  const [deviceId] = await knex('Device').insert({
    partnerId,
    deviceTypeId,
    siteId: deviceApiKey?.siteId || null,
    dailyTestCapacity: deviceTypeExternalId === 'CepheidGeneXpert' ? partnerData.deviceCapacityFactor * 4 : null, // for CepheidGeneXpert we are using module=4
    moduleBayCapacity: deviceTypeExternalId === 'CepheidGeneXpert' ? 4 : 0,
    deviceApprovalId,
    name: placeholderName,
    serial,
    shortName: placeholderName,
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

  await assignGeneratedDeviceName(knex, {
    deviceId,
    deviceTypeId,
    partnerPluginName: context.partnerPluginName,
    deviceTypePluginName: context.deviceTypePluginName,
  })

  await knex('DeviceApprovalLog').insert({
    deviceId,
    deviceApprovalId,
    changedOn: now,
    createdOn: now,
    createdBy: null,
  })

  if (deviceApiKey?.siteId) {
    await knex('Deployment').insert({
      deviceId,
      siteId: deviceApiKey.siteId,
      start: null,
      end: null,
      createdOn: now,
      createdBy: null,
      updatedOn: now,
      updatedBy: null,
    })

    await syncDeviceApprovalFromDeployments(knex, { deviceId, userId: null, now })
  }

  const device = await knex('Device as d')
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
  // Commented for now, This notification should be sent only once per GxConnect instance, in this place we are going to generate multiple notifications
  // await sendNotificationToContacts(payload, device)

  return device
}

/**
 * Sends notification emails/SMS to lab and installer contacts when a new device is created.
 *
 * @param {Object} payload - The request payload containing configuration data
 * @param {Object} device - The newly created device object
 */
// eslint-disable-next-line no-unused-vars
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

/**
 * Sends notification to a single person (email and/or SMS).
 *
 * @param {Object} contact - Contact information {name, email, cell}
 * @param {string} deviceName - Name of the device
 * @param {string} routerNumber - Router number
 * @param {boolean} noInventory - Whether inventory is disabled
 * @param {string} culture - Culture/locale for template
 * @param {number} cartridgeCount - Number of cartridges
 */
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
    await sendSms(cell, generatedTemplate.text).catch(err => logger.warning(err))
  }
}

module.exports = {
  processResultPayload,
}
