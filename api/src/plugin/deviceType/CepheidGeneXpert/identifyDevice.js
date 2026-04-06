const { knex } = require('../../../db')

/**
 * Identifies a device by instrument serial number (GxConnect plugin).
 * Uses Instrument Serial from payload to match against Instrument.serial in the database.
 *
 * @param {Object} payload - The request payload
 * @returns {Promise<Object|null>} Device object with all related data, or null if not found
 */
async function identifyDevice(payload, partnerId) {
  const instrumentSerial = payload?.result?.instrument?.serial || payload?.result?.instrumentSerial

  if (!instrumentSerial) {
    return null
  }

  const existingDeviceData = await knex('Device as d')
    .innerJoin('Instrument as i', 'i.deviceId', 'd.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('Partner as p', 'p.id', 'd.partnerId')
    .where('i.serial', instrumentSerial)
    .where('i.active', 1)
    .where('d.partnerId', partnerId)
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
      'i.serial as instrumentSerial'
    )

  return existingDeviceData || null
}

module.exports = { identifyDevice }
