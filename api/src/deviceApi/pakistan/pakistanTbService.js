const service = require('../service')

const RESULT_CATEGORY_DETECTED_ID = 1
const TB_TESTS = 'TB Tests'
const TB_CASES = 'TB Cases'
const DRTB_CASES = 'DRTB Cases'

const getResultPakistanHandler = service.deviceApiHandler(getTbResultsStats, {
  deviceLogType: service.DEVICE_LOG_TYPE_RESULT,
})

async function getTbResultsStats(context) {
  const { knex } = context
  const { from, to, states } = context.query

  const queries = getStatsQueries({ knex, from, to, states })

  const result = await Promise.all(queries)

  return {
    from,
    to,
    states,
    result: result
      .flat()
      .sort((r1, r2) => (r1.stateCode > r2.stateCode ? 1 : -1)),
  }
}

function getStatsQueries(context) {
  const queries = []
  const { knex, from, to, states } = context
  if (!states) {
    addCountryStats()
  } else {
    addStatesStats()
  }

  return queries

  function addCountryStats() {
    const tbTestsQuery = buildStatsQueryByCountry(knex, from, to).modify(qb =>
      qb.select(knex.raw(`'${TB_TESTS}' as "resultType"`))
    )
    const tbCasesQuery = buildStatsQueryByCountry(knex, from, to).modify(qb =>
      qb.select(knex.raw(`'${TB_CASES}' as "resultType"`))
    )
    const drTbCasesQuery = buildStatsQueryByCountry(knex, from, to).modify(qb =>
      qb.select(knex.raw(`'${DRTB_CASES}' as "resultType"`))
    )
    queries.push(tbTestsQuery, tbCasesQuery, drTbCasesQuery)
  }

  function addStatesStats() {
    queries.push(
      buildStatsQueryByState(knex, from, to, states, false, false).modify(qb =>
        qb.select(knex.raw(`'${TB_TESTS}' as "resultType"`))
      )
    )
    queries.push(
      buildStatsQueryByState(knex, from, to, states, false, false).modify(qb =>
        qb.select(knex.raw(`'${TB_CASES}' as "resultType"`))
      )
    )
    queries.push(
      buildStatsQueryByState(knex, from, to, states, false, false).modify(qb =>
        qb.select(knex.raw(`'${DRTB_CASES}' as "resultType"`))
      )
    )
  }
}

function buildStatsQueryByCountry(knex, from, to) {
  return knex('Assay as a')
    .join('Result as r', 'r.assayId', 'a.id')
    .join('AssayType as at', 'at.id', 'a.assayTypeId')
    .join('Disease as d', 'd.id', 'at.diseaseId')
    .where('d.externalId', 'tb')
    .modify(filterByDateTimeRange, from, to)
    .select(
      knex.raw(`"" as "stateCode"`),
      knex.raw(`"Whole country" as "state"`)
    )
    .count('r.id as total')
}

function buildStatsQueryByState(
  knex,
  from,
  to,
  states,
  onlyCases,
  onlyDrCases
) {
  return (
    knex('State as s')
      .join('Geography as g', 'g.stateId', 's.id')
      .join('Country as c', 'c.id', 'g.countryId')
      .leftJoin('Result as r', function () {
        this.on('r.geographyId', 'g.id')
        this.andOn('r.endedOn', '>=', knex.raw('?', from))
        this.andOn('r.endedOn', '<', knex.raw('?', to))
        if (onlyCases) {
          this.andOn('r.resultCategory1', RESULT_CATEGORY_DETECTED_ID)
        }
        if (onlyDrCases) {
          this.andOn('r.resultCategory2', RESULT_CATEGORY_DETECTED_ID)
        }
      })
      .leftJoin('Assay as a', 'a.id', 'r.assayId')
      .leftJoin('AssayType as at', 'at.id', 'a.assayTypeId')
      .leftJoin('Disease as d', function () {
        this.on('d.id', 'at.diseaseId')
        this.on('d.externalId', '=', knex.raw("'tb'"))
      })
      .whereIn('s.abbreviation', states)
      // .where('c.abbreviation', 'PK') // TODO: If it's ok, move to the country join
      .select('s.abbreviation as stateCode', 's.name as state')
      .groupBy('s.abbreviation')
      .orderByRaw('s.abbreviation asc, at.id asc')
      .count('r.id as total')
  )
}

function filterByDateTimeRange(queryBuilder, from, to) {
  queryBuilder.whereRaw('r.endedOn >= ?', from)
  queryBuilder.whereRaw('r.endedOn < ?', to)
  return queryBuilder
}

module.exports = {
  getResultPakistanHandler,
  getTbResultsStats,
}
