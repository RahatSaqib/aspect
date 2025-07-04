const pick = require('lodash/pick')
const isEmpty = require('lodash/isEmpty')

/**
 * Filter complementary values from site parameters
 * @param {Object} payload - site parameters
 * @returns - Normalized site parameters
 */
function normalizeSiteParameters(payload) {
  let site = sanitizeParameters(payload)

  site = normalizeFields(site)

  return site
}

/**
 * Removes complementary data from site parameters
 * @param {Object} payload - Site parameters
 * @returns New sanitized object only with site fields
 */
function sanitizeParameters(payload) {
  return Object.assign(
    pick(payload, [
      'name',
      'shortName',
      'notes',
      'geographyId',
      'city',
      'street1',
      'street2',
      'zip',
      'latitude',
      'longitude',
      'hoursStart',
      'hoursEnd',
      'siteTypeId',
      'siteTypeExternalId',
      'parentWarehouseId',
      'externalId',
      'sampleRegistrationAllowed',
    ]),
    {
      timezoneId: isEmpty(payload.timezone) ? null : payload.timezone,
    }
  )
}

/**
 * Trim exceded fields size
 * @param {Object} site - Site parameters to be persisted
 * @returns Same object with trimmed fields, if it's necessary
 */
function normalizeFields(site) {
  if (site.name.length > 255) {
    site.name = site.name.substr(0, 255)
  }
  if (site.shortName.length > 45) {
    site.shortName = site.shortName.substr(0, 45)
  }
  if (Number.isNaN(site.hoursStart)) {
    site.hoursStart = null
  }
  if (Number.isNaN(site.hoursEnd)) {
    site.hoursStart = null
  }
  return site
}

module.exports = { normalizeSiteParameters }
