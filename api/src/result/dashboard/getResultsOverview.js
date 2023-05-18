const { subDays } = require('date-fns')
const { startOfYear } = require('date-fns')
const { getConstraints, addPartnerQueryConstraints, addConstraints } = require('../../auth/constraints')
const { knex } = require('../../db')
const { getBaseQueryForResults } = require('../common/db')
const { SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY } = require('../query')

const { mtbDetected, rifDetected, mtbNoResult, mtbInvalid, mtbError } = SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY

const getResultCount = (dataConstraints, minDate, maxDate) =>
  getBaseQueryForResults()
    .clone()
    .where('dt.externalId', 'CepheidGeneXpert')
    .whereBetween('r.createdOn', [minDate, maxDate])
    .first({
      total: knex.raw(`count(*)-${mtbNoResult}-${mtbInvalid}-${mtbError}`),
      mtbDetected,
      rifDetected,
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
    total1Year: resultCountYear.total,
    mtbDetected1Year: resultCountYear.mtbDetected,
    rifDetected1Year: resultCountYear.rifDetected,
    total1Day: resultCountDay.total,
    mtbDetected1Day: resultCountDay.mtbDetected,
    rifDetected1Day: resultCountDay.rifDetected,
  }

  return {
    ok: true,
    data,
  }
}

module.exports = {
  getResultsOverview,
}
