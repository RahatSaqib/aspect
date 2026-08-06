const _ = require('lodash')
const Boom = require('@hapi/boom')
const { knex } = require('../../db')
const { createDeviceFromDeviceApi } = require('../../device/common/createDeviceFromDeviceApi')
const { deviceSeen } = require('../../device/actions')
const { loadPlugin } = require('../../plugin/loadPlugin')
const { resultReadyForNotification, resultLogged } = require('../../result/actions')
const { mergeResult } = require('./mergeResult')
const { findOpenModuleDisabledIssues } = require('../../issue/common/db')
const { resolveIssues } = require('../../issue/actions')
const { consumeInventoryForResult } = require('../../inventory/consumeInventoryForResult')
const { resultAutoTagging } = require('./result')
const { updateDeviceConfiguration } = require('../payloadHandlers/shared/logic')

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
  const instrumentMacAddress =
    _.get(payload, 'result.instrument.macAddress', null) || _.get(payload, 'result.instrument.mac_address', null)

  // Create context for processing payload
  const context = {
    defaultTimeZone,
    auth,
    now: new Date(),
    instrumentSerial,
    instrumentMacAddress,
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
        context.device = await createDeviceFromDeviceApi(context)
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

module.exports = {
  processResultPayload,
}
