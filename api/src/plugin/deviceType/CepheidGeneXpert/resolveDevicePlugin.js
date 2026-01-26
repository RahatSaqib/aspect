const _ = require('lodash')
const Boom = require('@hapi/boom')
const { transact } = require('../../../db')
const { findDevices } = require('../gxUtils')
const { deviceTypeToPlugin } = require('../../../shared/dictionary')
// Lazy load loadPlugin to avoid circular dependency (loadPlugin -> gxconnectPlugin -> resolveDevicePlugin -> loadPlugin)
const logger = require('../../../shared/logger')
const { createNewDevice } = require('../../../deviceApi/device')
const { sendNotificationToContacts } = require('../../../deviceApi/deviceContext/deviceNotifications')

/**
 * Identifies an existing device using MAC address and device serial number.
 * This prevents duplicate GxConnect devices from being created.
 * If the macAddress and instrument serial number match an existing device, returns that device.
 *
 * @param {Object} request - The request object with auth and payload
 * @returns {Promise<Object|null>} Device object if found, null otherwise
 */
async function identifyDevice(request) {
  const device = await transact(async trx => {
    const { auth, payload } = request
    const hostId = _.get(payload, 'configuration.data.hostId', null)
    const countryCode = _.get(payload, 'configuration.data.country', null)
    const deviceSerialNumber = _.get(payload, 'configuration.data.deviceSerialNumber')
    const macAddress = _.get(payload, 'configuration.data.macAddress')

    if (countryCode) {
      const { partnerId } = await trx('DeviceApiKey').where({ token: auth.credentials.token }).first('partnerId')
      const deviceDetails = {
        partnerId,
        hostId,
        deviceSerialNumber,
        macAddress,
        countryCode,
      }
      /**
       * get ALL devices which match parameters
       */
      let matchingDevices = await findDevices(deviceDetails, trx)
      /**
       * filter out decommissioned devices.
       * --> Notice that same device may be moved out to another location, and for changing location - it
       * should be first decommissioned, then re-installed in new location. In this case we create a new entry in
       * Device table. And in this case func findDevices returns old decommissioned devices (matching deviceSerialNumber or
       * macAddress, etc). And in below line we clean returned list from all decommissioned devices.
       */
      matchingDevices = matchingDevices.filter(
        it => it.deviceMaintenanceStatusExternalId !== 'inactiveDecommissioned' && it.approval !== 'decommissioned'
      )

      if (!_.isEmpty(matchingDevices)) {
        let matchingDevice = null
        if (matchingDevices.length > 1) {
          throw Boom.conflict(
            `Cannot uniquely determine which device this request came from using ${JSON.stringify(deviceDetails)})`
          )
        } else if (matchingDevices.length === 1) {
          ;[matchingDevice] = matchingDevices
        }

        const now = new Date()
        await trx.from('DeviceApiKey').where({ deviceId: matchingDevice.id }).update({ revoked: 1, updatedOn: now })
        await trx
          .from('DeviceApiKey')
          .where({
            token: auth.credentials.token,
          })
          .update({ deviceId: matchingDevice.id, updatedOn: now })

        // Fetch full device data with all joins
        const fullDevice = await trx('Device as d')
          .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
          .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
          .innerJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
          .leftJoin('Site as s', 'd.siteId', 's.id')
          .leftJoin('Geography as g', 's.geographyId', 'g.id')
          .leftJoin('Country as c', 'g.countryId', 'c.id')
          .leftJoin('Partner as p', 'p.id', 'd.partnerId')
          .where('d.id', matchingDevice.id)
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
            'c.abbreviation as countryAbbreviation'
          )

        return fullDevice
      }
    }
    return null
  })
  return device
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

    // Lazy load loadPlugin to avoid circular dependency
    const { loadPlugin } = require('../../loadPlugin')

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

const resolveDevicePlugin = {
  identifyDevice,
  createDevice,
}

module.exports = resolveDevicePlugin
