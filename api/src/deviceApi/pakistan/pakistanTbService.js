const service = require('../service')

const RESULT_CATEGORY_DETECTED_ID = 1
const TB_TESTS = 'TB Tests'
const TB_CASES = 'TB Cases'
const DRTB_CASES = 'DRTB Cases'

let knex
let from
let to
let states

const getResultPakistanHandler = service.deviceApiHandler(getTbResultsStats, {
  deviceLogType: service.DEVICE_LOG_TYPE_RESULT,
})

async function getTbResultsStats(context) {
  const { now, query } = context

  ;({ knex } = context)
  ;({ from, to, states } = query)

  const queries = await getStatsQueries()

  const result = await Promise.all(queries)

  return { from, to, states, result: result.flat() }
}

async function getStatsQueries() {
  let queries = []

  if (!states) {
    getCountryStats()
  } else {
    await getStatesStats()
  }

  return queries

  function getCountryStats() {
    const tbTestsQuery = buildStatsQueryByCountry().modify(qb =>
      qb.select(knex.raw(`'${TB_TESTS}' as "resultType"`))
    )
    const tbCasesQuery = buildStatsQueryByCountry().modify(qb =>
      qb.select(knex.raw(`'${TB_CASES}' as "resultType"`))
    )
    const drTbCasesQuery = buildStatsQueryByCountry().modify(qb =>
      qb.select(knex.raw(`'${DRTB_CASES}' as "resultType"`))
    )
    queries.push(tbTestsQuery, tbCasesQuery, drTbCasesQuery)
  }

  async function getStatesStats() {
    const statesIds = await knex('State as s')
      .whereIn('abbreviation', states)
      .select('id as id')
    queries = queries.concat(
      ...statesIds.map(state =>
        buildStatsQueryByState(state.id, false, false).modify(qb =>
          qb.select(knex.raw(`'${TB_TESTS}' as "resultType"`))
        )
      )
    )
    queries = queries.concat(
      ...statesIds.map(state =>
        buildStatsQueryByState(state.id, true, false).modify(qb =>
          qb.select(knex.raw(`'${TB_CASES}' as "resultType"`))
        )
      )
    )
    queries = queries.concat(
      ...statesIds.map(state =>
        buildStatsQueryByState(state.id, true, true).modify(qb =>
          qb.select(knex.raw(`'${DRTB_CASES}' as "resultType"`))
        )
      )
    )
  }
}

function buildStatsQueryByCountry() {
  return knex('Assay as a')
    .join('Result as r', 'r.assayId', 'a.id')
    .join('AssayType as at', 'at.id', 'a.assayTypeId')
    .join('Disease as d', 'd.id', 'at.diseaseId')
    .where('d.externalId', 'tb')
    .modify(filterByDateTimeRange)
    .select(
      knex.raw(`"" as "stateCode"`),
      knex.raw(`"whole country" as "state"`)
    )
    .count('r.id as total')
}

function buildStatsQueryByState(stateId, onlyCases, onlyDrCases) {
  const a = knex('State as s')
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
      // this.on('d.externalId', knex.raw('tb'))
    })
    .where('s.id', knex.raw('?', stateId))
    // .where('c.abbreviation', 'PK') //TODO: If is ok, move to the country join
    .select('s.abbreviation as stateCode', 's.name as state')
    .count('r.id as total')

  return a
}

function filterByDateTimeRange(queryBuilder) {
  queryBuilder.whereRaw('r.endedOn >= ?', from)
  queryBuilder.whereRaw('r.endedOn < ?', to)
  return queryBuilder
}

module.exports = {
  getResultPakistanHandler,
}
