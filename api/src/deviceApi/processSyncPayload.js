const _ = require('lodash')
const Boom = require('@hapi/boom')

const { knex, transact } = require('../db')
const { deviceTypeToPlugin, deviceApprovalToId } = require('../shared/dictionary')

const { getRemoteAddress } = require('../shared/request')

const { deviceSeen } = require('../device/actions')
const { loadPlugin } = require('../plugin/loadPlugin')
const logger = require('../shared/logger')

const { resultUpdated } = require('../result/actions')

const { removeAdditionalData } = require('../result/common/logic')
const { addDeviceDataWithContext } = require('./service')
const { DEVICE_LOG_TYPE_NONE } = require('./constants')

const { sendNotificationToContacts } = require('./deviceContext/sendNotificationToContacts')

const processSyncPayload = async (request, existingDeviceLogId = null) => {
  const isFastImport = false
  const handlerOptions = { createDevice: true, updatePing: true, updateDeviceLog: true }

  const { deviceLogType = DEVICE_LOG_TYPE_NONE } = handlerOptions
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
  const identifyDevice = await loadPlugin(partnerPluginName, deviceTypePluginName, 'identifyDevice')
  if (identifyDevice) {
    logger.debug('Trying identifyDevice plugin', {
      reLabel: 'deviceApi:processSyncPayload',
    })
    device = await identifyDevice(request)
    if (device) {
      logger.debug('Device found via identifyDevice plugin', {
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
  if (!device) {
    logger.debug('Using createDevice', {
      reLabel: 'deviceApi:processSyncPayload',
    })
    const deviceAndError = await createDevice(request, now)
    if (deviceAndError.error) {
      await updateLogs(request)
      return deviceAndError.error
    }

    device = deviceAndError.device
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

/**
 * Creates a new CepheidGeneXpert device from the request payload.
 * All device info from payload (instrumentSerial, MAC, serial, hostId, etc.) is available.
 *
 * @param {Object} request - The request object with auth, payload, etc.
 * @param {Date} now - Current timestamp
 * @returns {Promise<{device: Object, error: Object|null}>} Device object and optional error
 */
async function createDevice(request, now) {
  return transact(async trx => {
    const { auth } = request
    logger.debug('Create new CepheidGeneXpert device from request', {
      reLabel: 'deviceApi:resolveDevicePlugin.createDevice',
    })
    // Find API Key to use as template for new device
    const partnerApiKey = await trx('DeviceApiKey as k')
      .where({
        'k.token': auth.credentials.token,
        'k.revoked': false,
        'k.deviceId': null,
      })
      .leftJoin('Partner as p', 'p.id', 'k.partnerId')
      .first('k.id', 'k.partnerId', 'k.geographyId', 'k.siteId', 'p.plugin')
    if (!partnerApiKey) {
      return {
        error: Boom.notFound('Cannot find available API Key when creating new device'),
      }
    }
    const partnerPluginName = _.get(partnerApiKey, 'plugin')
    const deviceTypePluginName = await deviceTypeToPlugin(_.get(request, 'payload.type.id'))
    const apiKey = partnerApiKey

    // Require Device Type when creating device
    const transformNewDevicePayload = await loadPlugin(
      partnerPluginName,
      deviceTypePluginName,
      'transformNewDevicePayload'
    )
    const payload = await transformNewDevicePayload({
      payload: request.payload,
    })

    // Check if device already exists (backward compatibility with preProcessCreateDevice)
    const preProcessCreateDevice = await loadPlugin(partnerPluginName, deviceTypePluginName, 'preProcessCreateDevice')
    const existingDevice = await preProcessCreateDevice(request, now)

    if (!_.isEmpty(existingDevice)) {
      return { device: existingDevice }
    }

    const deviceTypeExternalId = _.get(payload, 'type.id', null)
    if (!deviceTypeExternalId) {
      return {
        error: Boom.badRequest('Must specify device type on first request with new key'),
      }
    }

    const siteExternalId = _.get(payload, 'site.id', null)
    let defaultSite = {}
    logger.debug(siteExternalId && !apiKey.geographyId && !apiKey.siteId, {
      reLabel: 'deviceApi:resolveDevicePlugin.createDevice',
    })
    if (siteExternalId && !apiKey.geographyId && !apiKey.siteId)
      defaultSite = await trx('Site as s').where('externalId', siteExternalId).first()

    const hostId = _.get(payload, 'configuration.data.hostId', null) || payload.hostId
    const serial = _.get(payload, 'configuration.data.deviceSerialNumber') || payload.serial
    const macAddress = _.get(payload, 'configuration.data.macAddress') || payload.macAddress

    const { device, error } = await createNewDevice(trx, now, {
      deviceTypeExternalId,
      name: payload.name,
      hostId: hostId || payload.name,
      serial,
      macAddress,
      partnerId: apiKey.partnerId,
      siteId: apiKey.siteId || _.get(defaultSite, 'id', null),
      approval: apiKey.siteId ? 'approved' : 'provisioned',
      timezone: _.get(payload, 'configuration.data.timezone', null),
    })
    logger.debug('Assign new device an api key', {
      reLabel: 'deviceApi:resolveDevicePlugin.createDevice',
    })
    // Assign new device to API Key
    await trx('DeviceApiKey').where({ id: apiKey.id }).update({ deviceId: device.id, updatedOn: now })

    // Send notifications
    await sendNotificationToContacts(request.payload, device)

    return { device, error }
  })
}

async function createNewDevice(
  knex,
  now,
  {
    deviceTypeExternalId,
    name,
    serial,
    partnerId,
    siteId,
    approval,
    shortName,
    macAddress,
    hostId,
    culture,
    timezone,
    configurationData = '{}',
    putInService,
    lastSeenOn,
    lastPingOn,
  }
) {
  const deviceType = await knex('DeviceType')
    .where({ externalId: deviceTypeExternalId })
    .first('id', 'name', 'plugin', 'externalId')
  if (deviceType == null) {
    return {
      error: Boom.badRequest(`Cannot find DeviceType with id ${deviceTypeExternalId}`),
    }
  }

  const { timeZone: defaultTimeZone } =
    (await knex('Site as s')
      .join('Geography as g', 's.geographyId', 'g.id')
      .join('Country as c', 'c.id', 'g.countryId')
      .where('s.id', siteId)
      .first(knex.raw('COALESCE(s.timezoneId, c.timezone) as timeZone'))) ||
    (await knex('Country as c').first('c.timezone as timeZone'))
  const { existingTimeZone } = await knex('TimeZone')
    .where('id', timezone || defaultTimeZone)
    .first('id as existingTimeZone')

  // Use or generate device name
  if (!name) {
    if (shortName) {
      name = shortName
    } else if (serial) {
      name = serial
    } else {
      const [deviceCount] = await knex('Device')
        .where({
          partnerId,
          deviceTypeId: deviceType.id,
        })
        .count('id as cnt')
      name = `${deviceType.name} #${deviceCount.cnt + 1}`
    }
  }
  if (!shortName && name) {
    shortName = name
  }
  const deviceApprovalId = await deviceApprovalToId(approval)
  if (shortName && shortName.length > 45) {
    shortName = shortName.substr(0, 45)
  }

  const partnerData = await knex('Partner').where({ id: partnerId }).first('deviceCapacityFactor')

  const [deviceId] = await knex('Device').insert({
    partnerId,
    siteId,
    deviceTypeId: deviceType.id,
    dailyTestCapacity: deviceType.externalId === 'CepheidGeneXpert' ? partnerData.deviceCapacityFactor * 4 : null, // for CepheidGeneXpert we are using module=4
    moduleBayCapacity: deviceType.externalId === 'CepheidGeneXpert' ? 4 : 0,
    deviceApprovalId,
    name,
    serial,
    shortName,
    macAddress,
    hostId,
    culture,
    timezone: existingTimeZone,
    configurationData,
    putInService,
    lastSeenOn,
    lastPingOn,
    createdOn: now,
    updatedOn: now,
  })
  await knex('DeviceApprovalLog').insert({
    deviceId,
    deviceApprovalId,
    changedOn: now,
    createdOn: now,
    createdBy: null,
  })
  const device = await knex('Device as d')
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .join('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
    .leftJoin('Partner as p', 'd.partnerId', 'p.id')
    .where('d.id', deviceId)
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
  return { device }
}

module.exports = {
  processSyncPayload,
}
