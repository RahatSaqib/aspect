const { startOfYear, endOfYear, startOfDay, endOfDay } = require('date-fns')
const {
  getConstraints,
  addPartnerQueryConstraints,
  addConstraints,
  getUserFromCredentials,
} = require('../../auth/constraints')
const { knex } = require('../../db')
const { getBaseQueryForResults } = require('../common/db')
const { getDateTimeProjectionInTimeZoneIANA } = require('../../shared/date')
const { SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY } = require('../query')

const { mtbDetectedTraceDetected, mtbDetectedRifDetected, mtbValid, mtbValidWithIndeterminate } =
  SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY

const getResultCount = (dataConstraints, minDate, maxDate, timezoneIANA) =>
  getBaseQueryForResults()
    .clone()
    /**
     * exclude testing device type `GxAlert`, allowing any other device types (`CepheidGeneXpert`, `molbioTruenat`, etc).
     * See chunk `if (_.get(constraints, 'deviceType.id')) {` in func `addDevicesAndSitesConstraints`
     * in `api/src/auth/constraints.js` where user permitted deviceType is used
     */
    .whereNot('dt.externalId', 'GxAlert')
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .whereBetween(getDateTimeProjectionInTimeZoneIANA(knex, 'r.endedOn', timezoneIANA), [minDate, maxDate])
    .first({
      mtbValid,
      mtbValidWithIndeterminate,
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

  const now = new Date()
  /**
   * We need a country timezone offset to use it in CONVERT_TZ mysql func
   * user.timezoneIANA is a country timezone - see getUser() in api/src/auth/service.js
   */
  const resultCountYear = await getResultCount(dataConstraints, startOfYear(now), endOfYear(now), user.timezoneIANA)
  const resultCountDay = await getResultCount(dataConstraints, startOfDay(now), endOfDay(now), user.timezoneIANA)

  const data = {
    total1Year: resultCountYear.mtbValid,
    mtbValidWithIndeterminate: resultCountYear.mtbValidWithIndeterminate,
    mtbDetected1Year: resultCountYear.mtbDetectedTraceDetected,
    rifDetected1Year: resultCountYear.mtbDetectedRifDetected,
    totalToday: resultCountDay.mtbValid,
    mtbValidWithIndeterminateToday: resultCountDay.mtbValidWithIndeterminate,
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
