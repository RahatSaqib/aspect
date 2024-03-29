const { subDays } = require('date-fns')
const {
  getConstraints,
  addPartnerQueryConstraints,
  addConstraints,
  getUserFromCredentials,
} = require('../../auth/constraints')
const { getBaseQueryForResults } = require('../common/db')
const { getOffsetFromTimeZone } = require('../../shared/date')
const { SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY } = require('../query')

const { mtbDetectedTraceDetected, mtbDetectedRifDetected, mtbValid } = SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY

const getResultCount = (dataConstraints, minDate, maxDate) =>
  getBaseQueryForResults()
    .clone()
    /**
     * exclude testing device type `GxAlert`, allowing any other device types (`CepheidGeneXpert`, `molbioTruenat`, etc).
     * See chunk `if (_.get(constraints, 'deviceType.id')) {` in func `addDevicesAndSitesConstraints`
     * in `api/src/auth/constraints.js` where user permitted deviceType is used
     */
    .whereNot('dt.externalId', 'GxAlert')
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .whereBetween('r.endedOn', [minDate, maxDate])
    .first({
      mtbValid,
      mtbDetectedTraceDetected,
      mtbDetectedRifDetected,
    })
    .modify(addPartnerQueryConstraints, dataConstraints)
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      assayType: 'at',
      device: 'd',
      deviceType: 'dt',
      sample: 'sp',
      site: 'si',
      geography: 'g',
      result: 'r',
      country: 'c',
      disease: 'dis',
    })
    .clone()

const getResultsOverview = async ({ auth }) => {
  const dataConstraints = await getConstraints(auth.credentials)
  const user = await getUserFromCredentials(auth.credentials)

  /**
   * local server time
   */
  const now = new Date()
  /**
   * We need a country timezone offset
   * user.timezoneIANA is a country timezone - see getUser() in api/src/auth/service.js
   */
  const tzOffset = getOffsetFromTimeZone(user.timezoneIANA, now)

  /**
   * Year starts at midnight (00:00:00) for local time (+HH:MM, i.e. +06:00)
   * and ends at 23:59:59.999 for local time  -
   * construct correct DateTime for this regardless of current server
   * timezone (i.e. explicitly define MM-DD and time with concatenated tz offset)
   */
  const year = now.getFullYear()
  const startOfYearInCountryTZ = new Date(`${year}-01-01 00:00:00.000${tzOffset}`)
  const endOfYearInCountryTZ = new Date(`${year}-12-31 23:59:59.999${tzOffset}`)

  const resultCountYear = await getResultCount(dataConstraints, startOfYearInCountryTZ, endOfYearInCountryTZ)
  const resultCountDay = await getResultCount(dataConstraints, subDays(now, 1), now)

  const data = {
    total1Year: resultCountYear.mtbValid,
    mtbDetected1Year: resultCountYear.mtbDetectedTraceDetected,
    rifDetected1Year: resultCountYear.mtbDetectedRifDetected,
    total1Day: resultCountDay.mtbValid,
    mtbDetected1Day: resultCountDay.mtbDetectedTraceDetected,
    rifDetected1Day: resultCountDay.mtbDetectedRifDetected,
  }

  return {
    ok: true,
    data,
  }
}

module.exports = {
  getResultsOverview,
}
