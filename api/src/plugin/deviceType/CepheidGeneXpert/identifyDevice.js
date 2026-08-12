const { knex } = require('../../../db')

function toTrimmedStringOrNull(value, maxLength) {
  if (value == null || value === '') {
    return null
  }

  const trimmed = String(value).trim()

  if (!trimmed) {
    return null
  }

  return maxLength ? trimmed.substr(0, maxLength) : trimmed
}

function matchInstrumentByMac(candidates = [], macAddress) {
  if (!macAddress) {
    return candidates[0] || null
  }

  return (
    candidates.find(candidate => candidate.instrumentMacAddress === macAddress) ||
    candidates.find(candidate => !candidate.instrumentMacAddress) ||
    null
  )
}

/**
 * Identifies a device by instrument serial number (GxConnect plugin).
 * Uses Instrument Serial from payload to match against Instrument.serial in the database.
 *
 * @param {Object} payload - The request payload
 * @returns {Promise<Object|null>} Device object with all related data, or null if not found
 */
async function identifyDevice(payload, partnerId) {
  const instrumentSerial = payload?.result?.instrument?.serial || payload?.result?.instrumentSerial
  const instrumentMacAddress = toTrimmedStringOrNull(payload?.result?.instrument?.macAddress, 17)

  if (!instrumentSerial) {
    return null
  }

  const candidates = await knex('Device as d')
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
    .orderBy([
      { column: 'i.active', order: 'desc' },
      { column: 'i.id', order: 'desc' },
    ])
    .select(
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
      'i.macAddress as instrumentMacAddress'
    )

  const matched = matchInstrumentByMac(candidates, instrumentMacAddress)

  return matched || null
}

module.exports = { identifyDevice }
