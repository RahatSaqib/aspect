const { getConstraints, addConstraints } = require('../auth/constraints')
const { knex } = require('../db')
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

  const uniqueResults = knex('Result as r')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin('Geography as g', 'si.geographyId', 'g.id')
    .join('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('Assay as a', 'a.deviceTypeId', 'dt.id')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
      geography: 'g',
      site: 'si',
      device: 'd',
      deviceType: 'dt',
    })
    .whereIn('a.id', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra])
    .where('dt.externalId', 'CepheidGeneXpert')
    .whereRaw(`${tzOffset} >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)`)
    .distinct('r.id')
    .select('r.resultCategory1', knex.raw(`YEAR(${tzOffset}) AS year, MONTH(${tzOffset}) AS month`))
    .orderBy('year', 'month')
    .modify(queryBuilder => {
      if (state) {
        const stateIds = state
          .split(',')
          .map(Number)
          .filter(n => !Number.isNaN(n))
        queryBuilder.join('State as s', 'g.stateId', 's.id').whereIn('s.id', stateIds)
      }
    })

  const query = knex({ ur: uniqueResults })
    .select(
      knex.raw(`COUNT(*) AS total`),
      'year',
      'month',
      knex.raw(`SUM(CASE WHEN ur.resultCategory1 = ? THEN 1 ELSE 0 END) AS categoryTotal`, [categoryId])
    )
    .groupBy('year', 'month')
    .orderBy('year', 'month')

  return query
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
