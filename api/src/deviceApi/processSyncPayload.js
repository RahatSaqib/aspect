const _ = require('lodash')

const { knex } = require('../db')
const { getRemoteAddress } = require('../shared/request')

const { deviceSeen } = require('../device/actions')
const { loadPlugin } = require('../plugin/loadPlugin')
const logger = require('../shared/logger')

const { resultUpdated } = require('../result/actions')

const { removeAdditionalData } = require('../result/common/logic')
const { addDeviceDataWithContext } = require('./service')
const { DEVICE_LOG_TYPE_NONE } = require('./constants')

const { createNewDevice } = require('./deviceContext/deviceCreation')
const { sendNotificationToContacts } = require('./deviceContext/deviceNotifications')

const processSyncPayload = async (request, existingDeviceLogId = null) => {
  const isFastImport = false
  const handlerOptions = { createDevice: true, updatePing: true, updateDeviceLog: true }

  // --- Begin inlined resolveDeviceContext logic ---
  const { createDevice = false, deviceLogType = DEVICE_LOG_TYPE_NONE } = handlerOptions // DEVICE_LOG_TYPE_NONE = 0
  const messageContext = request.plugins.messageContext.bindActionCreators({
    resultUpdated,
  })
  const { auth } = request
  const now = new Date()

  // Get plugin names for device resolution
  let partnerPluginName
  let deviceTypePluginName
  if (auth.credentials.token) {
    ;({ partnerPluginName, deviceTypePluginName } =
      (await knex
        .from('DeviceApiKey as dak')
        .leftJoin('Partner as dak_p', 'dak_p.id', 'dak.partnerId')
        .leftJoin('Device as dev', 'dev.id', 'dak.deviceId')
        .leftJoin('DeviceType as dt', 'dt.id', 'dev.deviceTypeId')
        .leftJoin('Partner as dev_p', 'dev_p.id', 'dev.partnerId')
        .where('dak.token', auth.credentials.token)
        .first(
          knex.raw('COALESCE(dev_p.plugin, dak_p.plugin) as partnerPluginName'),
          'dt.plugin as deviceTypePluginName'
        )) || {})
  }
  const { id: deviceTypeId } = _.get(request, 'payload.type', {})
  if (!deviceTypePluginName && deviceTypeId) {
    ;({ deviceTypePluginName } =
      (await knex
        .from('DeviceType as dt')
        .where('dt.externalId', deviceTypeId)
        .first('dt.plugin as deviceTypePluginName')) || {})
  }

  // Try to resolve device (plugin first, then standard lookup)
  // Inline resolveDevice from deviceIdentification.js
  let device
  const resolveDevicePlugin = await loadPlugin(partnerPluginName, deviceTypePluginName, 'resolveDevicePlugin')
  if (resolveDevicePlugin && resolveDevicePlugin.identifyDevice) {
    logger.debug('Trying resolveDevicePlugin.identifyDevice', {
      reLabel: 'deviceApi:processSyncPayload',
    })
    device = await resolveDevicePlugin.identifyDevice(request)
    if (device) {
      logger.debug('Device found via resolveDevicePlugin.identifyDevice', {
        reLabel: 'deviceApi:processSyncPayload',
      })
    }
  }
  if (!device) {
    // fallback to standard DeviceApiKey lookup
    logger.debug('Falling back to standard DeviceApiKey lookup', {
      reLabel: 'deviceApi:processSyncPayload',
    })
    const existingDeviceAndData = await knex('DeviceApiKey as dak')
      .innerJoin('Device as d', 'dak.deviceId', 'd.id')
      .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
      .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .innerJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
      .leftJoin('Site as s', 'd.siteId', 's.id')
      .leftJoin('Geography as g', 's.geographyId', 'g.id')
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
        'dtc.name as deviceTypeCategory',
        'c.abbreviation as countryAbbreviation',
        'dak.token'
      )
    device = existingDeviceAndData || null
  }

  // If device not found and creation is enabled, try to create it
  if (!device && createDevice) {
    let createdDevice = null
    if (resolveDevicePlugin && resolveDevicePlugin.createDevice) {
      logger.debug('Using resolveDevicePlugin.createDevice', {
        reLabel: 'deviceApi:processSyncPayload',
      })
      const deviceAndError = await resolveDevicePlugin.createDevice(request, now)
      if (deviceAndError.error) {
        await updateLogs(request)
        return deviceAndError.error
      }
      createdDevice = deviceAndError.device
    } else {
      logger.debug('Using fallback createNewDevice', {
        reLabel: 'deviceApi:processSyncPayload',
      })
      // Inline createNewDevice from deviceCreation.js (call, not logic)
      const deviceAndError = await createNewDevice(request, now)
      if (deviceAndError.error) {
        await updateLogs(request)
        return deviceAndError.error
      }
      createdDevice = deviceAndError.device
    }
    device = createdDevice
    // Send notification
    await sendNotificationToContacts(request.payload, device)
  }

  if (!device) {
    await updateLogs(request)
    return { error: 'No device found' }
  }

  // Get partner information
  const partner = await knex('Partner as p')
    .innerJoin('Device as d', 'd.partnerId', 'p.id')
    .where({ 'd.id': device.id })
    .first('p.id', 'p.deviceLogHistoryDays', 'p.plugin as partnerPluginName')
  if (!partner) {
    await updateLogs(request)
    return { error: 'Device not assigned to partner' }
  }

  // Get user ID
  let userId = null
  try {
    const { getUser } = require('../auth/service')
    ;({ id: userId } = (await getUser(auth.credentials.name)) || {})
    if (!userId) {
      ;({ createdBy: userId } = await knex('Device').where('id', device.id).first('createdBy'))
    }
  } catch (e) {
    userId = null
  }

  // Build context object (plain object, not class)
  const context = {
    auth,
    userId,
    now,
    device,
    payload: request.payload,
    query: request.query,
    messageContext,
    deviceLogType,
    partnerId: partner.id,
    partnerPluginName: partner.partnerPluginName,
    deviceTypePluginName: device.deviceTypePluginName,
    actions: {},
  }
  // --- End inlined resolveDeviceContext logic ---

  const deviceId = device.id
  // TODO Does Hapi Remote address work through proxies? Check headers?
  const remoteAddress = getRemoteAddress(request)

  // Insert Device Log and Update Ping prior to calling handler and
  // in separate transaction so it is recorded even if handler fails
  let deviceLogId = existingDeviceLogId
  let deviceLogRawMessage = null
  if (handlerOptions.updateDeviceLog) {
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
