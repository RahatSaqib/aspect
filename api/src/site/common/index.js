const pick = require('lodash/pick')
const isEmpty = require('lodash/isEmpty')

/**
 * Filter complementary values from site parameters
 * @param {Object} payload - site parameters
 * @returns - Normalized site parameters
 */
async function normalizeSiteParameters(payload) {
  const site = Object.assign(
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
      'warehouseId',
    ]),
    {
      timezoneId: isEmpty(payload.timezone) ? null : payload.timezone,
    }
  )
  return site
}

module.exports = { normalizeSiteParameters }
