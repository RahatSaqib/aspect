const { loadPlugin } = require('../../plugin/loadPlugin')
const logger = require('../../shared/logger')

/**
 * Looks up a device by DeviceApiKey token (standard lookup method).
 * This is the fallback when resolveDevicePlugin doesn't find a device.
 *
 * @param {Object} request - The request object with auth credentials
 * @param {Object} knex - Database connection
 * @returns {Object|null} Device object with all related data, or null if not found
 */
async function lookupDeviceByApiKey(request, knex) {
  const { auth } = request

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

  return existingDeviceAndData || null
}

/**
 * Resolves a device using the resolveDevicePlugin if available,
 * otherwise falls back to standard DeviceApiKey lookup.
 * All device info from payload (instrumentSerial, MAC, serial, hostId, etc.) is available to plugins.
 *
 * @param {Object} request - The request object with auth, payload, etc.
 * @param {Object} knex - Database connection
 * @param {string} partnerPluginName - Partner plugin name
 * @param {string} deviceTypePluginName - Device type plugin name
 * @returns {Object|null} Device object if found, null otherwise
 */
async function resolveDevice(request, knex, partnerPluginName, deviceTypePluginName) {
  // Try plugin first if available
  const resolveDevicePlugin = await loadPlugin(partnerPluginName, deviceTypePluginName, 'resolveDevicePlugin')

  if (resolveDevicePlugin && resolveDevicePlugin.identifyDevice) {
    logger.debug('Trying resolveDevicePlugin.identifyDevice', {
      reLabel: 'deviceApi:resolveDevice',
    })
    const device = await resolveDevicePlugin.identifyDevice(request)
    if (device) {
      logger.debug('Device found via resolveDevicePlugin.identifyDevice', {
        reLabel: 'deviceApi:resolveDevice',
      })
      return device
    }
  }

  // Fallback to standard DeviceApiKey lookup
  logger.debug('Falling back to standard DeviceApiKey lookup', {
    reLabel: 'deviceApi:resolveDevice',
  })
  return lookupDeviceByApiKey(request, knex)
}

module.exports = {
  resolveDevice,
  lookupDeviceByApiKey,
}
