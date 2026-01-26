const _ = require('lodash')

const { knex } = require('../db')
const { getRemoteAddress } = require('../shared/request')

const { deviceSeen } = require('../device/actions')
const { loadPlugin } = require('../plugin/loadPlugin')
const logger = require('../shared/logger')
const { resolveDeviceContext } = require('./deviceContext')

const { removeAdditionalData } = require('../result/common/logic')
const { addDeviceDataWithContext } = require('./service')

const processSyncPayload = async (request, existingDeviceLogId = null) => {
  const defaultHandlerOptions = {}
  const isFastImport = false

  const { error, context } = await resolveDeviceContext(addDeviceDataWithContext, request, defaultHandlerOptions)
  if (error) {
    await updateLogs(request)
    return error
  }

  let handlerOptions = await getHandlerOptionsFromContext(addDeviceDataWithContext, context, defaultHandlerOptions)
  const { updateDeviceLog = false } = handlerOptions
  const { device, now } = context
  const deviceId = device.id
  // TODO Does Hapi Remote address work through proxies? Check headers?
  const remoteAddress = getRemoteAddress(request)

  // Insert Device Log and Update Ping prior to calling handler and
  // in separate transaction so it is recorded even if handler fails
  let deviceLogId = existingDeviceLogId
  let deviceLogRawMessage = null
  if (updateDeviceLog) {
    const formattedResult = removeAdditionalData(request.plugins.rawPayload)

    // TODO DeviceLog handle non-JSON payloads
    deviceLogRawMessage = JSON.stringify(formattedResult)

    logger.debug('need to ensure DeviceLog is inserted even if failure below', {
      reLabel: 'deviceApi:processSyncPayload',
    })

    if (deviceLogId) {
      await knex('DeviceLog')
        .where('id', deviceLogId)
        .update({
          deviceId,
          source: _.get(context.payload, 'log.source', ''),
          createdOn: now,
          rawMessage: deviceLogRawMessage,
          processed: true,
        })
    } else {
      // need to ensure DeviceLog is inserted even if failure below
      ;[deviceLogId] = await knex('DeviceLog').insert({
        deviceId,
        source: _.get(context.payload, 'log.source', ''),
        createdOn: now,
        senderIp: remoteAddress,
        rawMessage: deviceLogRawMessage,
        processed: true,
      })
    }
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
    response = await addDeviceDataWithContext(context)

    // If handler changes device (e.g. GxAlert plugin), update timestamps
    // for new device as necessary
    if (context.device.id !== originalDeviceId) {
      handlerOptions = await getHandlerOptionsFromContext(addDeviceDataWithContext, context, defaultHandlerOptions)
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
}

async function getHandlerOptionsFromContext(
  handler,
  { partnerPluginName, deviceTypePluginName },
  defaultHandlerOptions = {}
) {
  const handlerOptionGroups = await loadPlugin(partnerPluginName, deviceTypePluginName, 'handlerOptions')
  return _.merge({}, defaultHandlerOptions, handlerOptionGroups[handler.name] || {})
}

async function updateDeviceData(context, handlerOptions = {}, remoteAddress) {
  const { knex, partnerPluginName, deviceTypePluginName, device, payload } = context
  const { updatePing = false } = handlerOptions

  const deviceUpdates = {}

  const getDeviceSeenOn = await loadPlugin(partnerPluginName, deviceTypePluginName, 'getDeviceSeenOn')
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

    const getDevicePingOn = await loadPlugin(partnerPluginName, deviceTypePluginName, 'getDevicePingOn')
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

module.exports = {
  processSyncPayload,
}
