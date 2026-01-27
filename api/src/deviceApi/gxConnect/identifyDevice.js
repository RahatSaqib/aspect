const _ = require('lodash')
const { knex } = require('../../db')

/**
 * Identifies a device by instrument serial number (GxConnect plugin).
 * Uses instrument.serial from payload to match against Instrument.serial in the database.
 *
 * @param {Object} request - The request object with auth credentials and payload
 * @returns {Promise<Object|null>} Device object with all related data, or null if not found
 */
async function identifyDevice(request, context) {
  const { auth, payload } = request

  const instrumentSerial = _.get(payload, 'result.instrument.serial') || _.get(payload, 'instrument.serial')

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
    .where('d.partnerId', context.partnerId)
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
      'i.serial as instrumentSerial',
      knex.raw('? as token', [auth.credentials.token || null])
    )

  return existingDeviceData || null
}

module.exports = { identifyDevice }
