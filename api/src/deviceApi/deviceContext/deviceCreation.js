const Boom = require('@hapi/boom')
const _ = require('lodash')
const { transact } = require('../../db')
const { deviceTypeToPlugin } = require('../../shared/dictionary')
const { loadPlugin } = require('../../plugin/loadPlugin')
const logger = require('../../shared/logger')
const { createNewDevice: createNewDeviceInDb } = require('../device')

/**
 * Creates a new device from the request payload.
 * This is the fallback creation logic when resolveDevicePlugin doesn't handle creation.
 * All device info from payload (instrumentSerial, MAC, serial, hostId, etc.) is available.
 *
 * @param {Object} request - The request object with auth, payload, etc.
 * @param {Date} now - Current timestamp
 * @returns {Promise<{device: Object, error: Object|null}>} Device object and optional error
 */
async function createNewDevice(request, now) {
  return transact(async knex => {
    const { auth } = request
    logger.debug('Create new device from request', {
      reLabel: 'deviceApi:createNewDevice',
    })
    // Find API Key to use as template for new device
    const partnerApiKey = await knex('DeviceApiKey as k')
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
      reLabel: 'deviceApi:createNewDevice',
    })
    if (siteExternalId && !apiKey.geographyId && !apiKey.siteId)
      defaultSite = await knex('Site as s').where('externalId', siteExternalId).first()

    const hostId = _.get(payload, 'configuration.data.hostId', null) || payload.hostId
    const serial = _.get(payload, 'configuration.data.deviceSerialNumber') || payload.serial
    const macAddress = _.get(payload, 'configuration.data.macAddress') || payload.macAddress

    const { device, error } = await createNewDeviceInDb(knex, now, {
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
      reLabel: 'deviceApi:createNewDevice',
    })
    // Assign new device to API Key
    await knex('DeviceApiKey').where({ id: apiKey.id }).update({ deviceId: device.id, updatedOn: now })

    return { device, error }
  })
}

module.exports = {
  createNewDevice,
}
