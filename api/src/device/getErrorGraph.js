const { getConstraints, addConstraints, getUserFromCredentials } = require('../auth/constraints')
const { knex, filterParams } = require('../db')
const { getBaseQueryForFactResultsDeviceByTimeFrame } = require('../fact/common/db')
const { allResultCategoryToId, allAssayToId } = require('../shared/dictionary')

const calculatePercentage = errorResultAgg => {
  const filteredData = errorResultAgg.filter(item => item.categoryTotal > 0)

  return filteredData.map(item => {
    const percentage = ((item.categoryTotal / item.total) * 100).toFixed(1)
    return {
      year: item.year,
      month: item.month,
      percentage: Number(percentage),
    }
  })
}

const getErrorResultAgg = (knex, assayIds, dataConstraints, categoryId, timezoneIANA, state, query) => {
  const tzOffset = `CONVERT_TZ(r.startedOn, "+00:00", "${timezoneIANA}")`

  /**
   * get base query which uses FactResultsDeviceByTimeFrame table
   */
  const factTableQuery = getBaseQueryForFactResultsDeviceByTimeFrame(knex, {
    addConstraints,
    dataConstraints,
    filterParams,
    assayIds,
    query,
    timeFrame: 'day',
  })
    .where('dt.externalId', ['CepheidGeneXpert'])
    .whereIn('r.assayId', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra])
    .whereRaw(`${tzOffset} >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)`)
    .select(
      knex.raw(`YEAR(r.startedOn) AS year,  MONTH(r.startedOn) AS month`),
      knex.raw(`SUM(CASE WHEN r.resultCategory1 = ? THEN r.resultCount ELSE 0 END) AS categoryTotal`, [categoryId])
    )
    .sum({ total: 'r.resultCount' })
    .orderBy('year', 'month')
    .groupBy('year', 'month')
    .modify(queryBuilder => {
      if (state) {
        const stateIds = state
          .split(',')
          .map(Number)
          .filter(n => !Number.isNaN(n))
        queryBuilder.join('State as stt', 'g.stateId', 'stt.id').whereIn('stt.id', stateIds)
      }
    })

  return factTableQuery
}

const getMtbErrorGraph = async request => {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const { category, state } = query

  const assayIds = await allAssayToId()
  const resultCategoryIds = await allResultCategoryToId()

  const categoryMap = {
    invalid: resultCategoryIds.Invalid,
    error: resultCategoryIds.Error,
    noResult: resultCategoryIds.NoResult,
  }

  const user = await getUserFromCredentials(auth.credentials)
  const { timezoneIANA } = user

  const errorResultAgg = await getErrorResultAgg(
    knex,
    assayIds,
    dataConstraints,
    categoryMap[category],
    timezoneIANA,
    state,
    query
  )
  const graphData = calculatePercentage(errorResultAgg)

  return { ok: true, data: graphData }
}

module.exports = getMtbErrorGraph
