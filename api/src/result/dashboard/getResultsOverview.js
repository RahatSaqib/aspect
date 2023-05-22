const { subDays } = require('date-fns')
const { startOfYear } = require('date-fns')
const { getConstraints, addPartnerQueryConstraints, addConstraints } = require('../../auth/constraints')
const { getBaseQueryForResults } = require('../common/db')
const { SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY } = require('../query')

const { mtbDetectedTraceDetected, mtbDetectedRifDetected, mtbValid } = SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY

const getResultCount = (dataConstraints, minDate, maxDate) =>
  getBaseQueryForResults()
    .clone()
    .where('dt.externalId', 'CepheidGeneXpert')
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .whereBetween('r.createdOn', [minDate, maxDate])
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
  const now = new Date()

  const resultCountYear = await getResultCount(dataConstraints, startOfYear(now), now)
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
