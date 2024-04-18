const { getConstraints } = require('../auth/constraints')
const { knex } = require('../db')
const { getBaseQuery } = require('../result/query')
const { getOffsetFromUser } = require('../shared/date')
const { allResultCategoryToId, allAssayToId } = require('../shared/dictionary')

const calculatePercentage = errorResultAgg => {
  return errorResultAgg.map(item => {
    const percentage = item.total > 0 ? ((item.categoryTotal / item.total) * 100).toFixed(1) : '0.0'
    return {
      year: item.year,
      month: item.month,
      percentage: `${percentage}%`,
    }
  })
}

const getErrorResultAgg = (knex, assayIds, dataConstraints, categoryId, offset, state) => {
  const tzOffset = `CONVERT_TZ(r.endedOn, "+00:00", "${offset}")`

  let aggQuery = getBaseQuery(knex, dataConstraints)
    .join('Device as d', 'd.id', 'r.deviceId')
    .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .whereIn('a.id', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra])
    .where('dt.externalId', 'CepheidGeneXpert')
    .whereRaw(`${tzOffset} >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)`)
    .select(
      knex.raw(`YEAR(${tzOffset}) AS year, MONTH(${tzOffset}) AS month, COUNT(*) AS total,
                  SUM(CASE WHEN resultCategory1 = ${categoryId} THEN 1 ELSE 0 END) AS categoryTotal`)
    )
    .groupBy(knex.raw(`YEAR(${tzOffset}), MONTH(${tzOffset})`))
    .orderBy('year', 'month')

  if (state) {
    const stateIds = state
      .split(',')
      .map(Number)
      .filter(n => !isNaN(n))
    aggQuery = aggQuery.join('State as s', 'g.stateId', 's.id').whereIn('s.id', stateIds)
  }

  return aggQuery
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

  const offset = await getOffsetFromUser(knex, auth.credentials.name)

  const errorResultAgg = await getErrorResultAgg(knex, assayIds, dataConstraints, categoryMap[category], offset, state)

  const graphData = calculatePercentage(errorResultAgg)

  return { ok: true, data: graphData }
}

module.exports = getMtbErrorGraph
