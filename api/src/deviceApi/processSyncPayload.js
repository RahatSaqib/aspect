const _ = require('lodash')
const Boom = require('@hapi/boom')
const { knex, transact } = require('../db')
const { deviceApprovalToId } = require('../shared/dictionary')
const { getRemoteAddress } = require('../shared/request')
const { deviceSeen } = require('../device/actions')
const { loadPlugin } = require('../plugin/loadPlugin')
const logger = require('../shared/logger')
const { resultUpdated } = require('../result/actions')
const { addDeviceDataWithContext } = require('./service')
const { sendNotificationToContacts } = require('./deviceContext/sendNotificationToContacts')
const { getUser } = require('../auth/service')

const processSyncPayload = async (request, deviceLogId) => {
  const isFastImport = false

  const messageContext = request.plugins.messageContext.bindActionCreators({
    resultUpdated,
  })
  const { auth, payload } = request
  const now = new Date()

  // Get user ID
  let userId = null

  ;({ id: userId } = (await getUser(auth?.credentials?.name)) || {})
  // TODO: In the below commented code, why to take the user from the device? better to use the DAK:
  // Commenting this as I want to create the context before identifyDevice is called
  // if (!userId) {
  //   ;({ createdBy: userId } = await knex('Device').where('id', device.id).first('createdBy'))
  // }

  const { id: deviceTypeExternalId } = payload?.type ?? {}
  // Get plugin names for device resolution
  let partnerPluginName
  let deviceTypePluginName
  let partnerId
  if (auth.credentials.token) {
    ;({ partnerPluginName, deviceTypePluginName, partnerId } =
      (await knex
        .from('DeviceApiKey as dak')
        .leftJoin('Partner as p', 'p.id', 'dak.partnerId')
        .leftJoin('DeviceType as dt')
        .where('dt.externalId', deviceTypeExternalId)
        .where('dak.token', auth.credentials.token)
        .first(
          knex.raw('p.plugin as partnerPluginName'),
          'dt.plugin as deviceTypePluginName',
          'dak.partnerId as partnerId'
        )) || {})
  }

  const context = {
    auth,
    userId,
    now,
    payload: request.payload,
    query: request.query,
    messageContext,
    partnerId,
    partnerPluginName,
    deviceTypePluginName,
    actions: {},
  }

  // Try to resolve device via identifyDevice plugin (e.g. gxConnect)
  let device
  const identifyDevice = await loadPlugin(partnerPluginName, deviceTypePluginName, 'identifyDevice')
  if (identifyDevice) {
    device = await identifyDevice(request, context)
  }

  // If device not found and creation is enabled, try to create it
  if (!device) {
    const deviceAndError = await createDevice(request, now)
    if (deviceAndError.error) {
      await updateLogs(request)
      return deviceAndError.error
    }

    device = deviceAndError.device
    // Send notification
    await sendNotificationToContacts(request.payload, device)
  }

  // If device creation has failed, update the logs and return the error
  if (!device) {
    await updateLogs(request)
    return { error: 'No device found' }
  }

  context.device = device

  // TODO Does Hapi Remote address work through proxies? Check headers?
  const remoteAddress = getRemoteAddress(request)

  await knex('DeviceLog').where('id', deviceLogId).update({
    deviceId: device.id,
    processed: true,
  }) // TODO: This here? it's fine? it's not transactioned?

  let response = {}
  await context.messageContext.transact(async knex => {
    context.knex = knex
    context.deviceLogId = deviceLogId
    context.isFastImport = isFastImport

    // update timestamps as necessary for original device
    const originalDeviceId = context.device.id
    if (!isFastImport) {
      await updateDeviceData(context, remoteAddress)
    }

    // invoke delegate handler
    response = await addDeviceDataWithContext(context)

    // If handler changes device (e.g. GxAlert plugin), update timestamps
    // for new device as necessary
    if (context.device.id !== originalDeviceId) {
      if (!isFastImport) {
        // TODO: Check: With new instrument serial device identification, there is no change of device anymore I think
        await updateDeviceData(context, remoteAddress)
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

async function updateDeviceData(context, payload, remoteAddress) {
  const { knex, partnerPluginName, deviceTypePluginName, device } = context

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

  logger.debug('update device ping on', {
    reLabel: 'deviceApi:updateDeviceData',
  })
  const getDevicePingOn = await loadPlugin(partnerPluginName, deviceTypePluginName, 'getDevicePingOn')
  const devicePingOn = await getDevicePingOn(context)
  if (devicePingOn != null) {
    deviceUpdates.lastPingOn = devicePingOn
    deviceUpdates.lastPingFromIp = remoteAddress
  }

  // TODO: Remove this deprecated field
  if (context.instrumentSerial) deviceUpdates.lastInstrumentSerial = context.instrumentSerial

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
async function createDevice(originalPayload, context) {
  return transact(async trx => {
    // Require Device Type when creating device
    const transformNewDevicePayload = await loadPlugin(
      context.partnerPluginName,
      context.deviceTypePluginName,
      'transformNewDevicePayload'
    )
    const payload = await transformNewDevicePayload({
      payload: originalPayload,
    })

    const hostId = _.get(payload, 'configuration.data.hostId', null) || payload.hostId
    const serial = _.get(payload, 'configuration.data.deviceSerialNumber') || payload.serial
    const macAddress = _.get(payload, 'configuration.data.macAddress') || payload.macAddress

    const { device, error } = await createNewDevice(trx, context.now, {
      deviceTypeExternalId: context.deviceTypeExternalId,
      name: payload.name,
      hostId: hostId || payload.name,
      serial,
      macAddress,
      partnerId: context.partnerId,
      // TODO: Program initial state
      // approval: apiKey.siteId ? 'approved' : 'provisioned',
      timezone: _.get(payload, 'configuration.data.timezone', null),
    })

    const postProcessCreateDevice = await loadPlugin(
      context.partnerPluginName,
      context.deviceTypePluginName,
      'postProcessCreateDevice'
    )
    if (postProcessCreateDevice) {
      await postProcessCreateDevice(context, device)
      return device
    }

    // Send notifications
    await sendNotificationToContacts(payload, device)

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
