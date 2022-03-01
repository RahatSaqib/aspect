const service = require('../service')

const RESULT_CATEGORY_DETECTED_ID = 1
const TB_TESTS = 'TB Tests'
const TB_CASES = 'TB Cases'
const DRTB_CASES = 'DRTB Cases'

const testsQueryType = {
  queryDescription: TB_TESTS,
  onlyCases: false,
  onlyDrCases: false,
}

const casesQueryType = {
  queryDescription: TB_CASES,
  onlyCases: true,
  onlyDrCases: false,
}
const drCasesQueryType = {
  queryDescription: DRTB_CASES,
  onlyCases: true,
  onlyDrCases: true,
}

const getResultPakistanHandler = service.deviceApiHandler(getTbResultsStats, {
  deviceLogType: service.DEVICE_LOG_TYPE_NONE,
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
    addCountryStatsQueries()
  } else {
    addStatesStatsQueries()
  }

  return queries

  function addCountryStatsQueries() {
    const tbTestsQuery = buildStatsQueryByCountry(
      knex,
      from,
      to,
      testsQueryType
    )

    const tbCasesQuery = buildStatsQueryByCountry(
      knex,
      from,
      to,
      casesQueryType
    )

    const drTbCasesQuery = buildStatsQueryByCountry(
      knex,
      from,
      to,
      drCasesQueryType
    )

    queries.push(tbTestsQuery, tbCasesQuery, drTbCasesQuery)
  }

  function addStatesStatsQueries() {
    queries.push(buildStatsQueryByState(knex, from, to, states, testsQueryType))
    queries.push(buildStatsQueryByState(knex, from, to, states, casesQueryType))
    queries.push(
      buildStatsQueryByState(knex, from, to, states, drCasesQueryType)
    )
  }
}

function buildStatsQueryByCountry(knex, from, to, queryParams) {
  return (
    knex('Country as c')
      .join('Geography as g', 'g.countryId', 'c.id')
      .leftJoin('Result as r', function () {
        this.on('r.geographyId', 'g.id')
        this.on('r.endedOn', '>=', knex.raw('?', from))
        this.andOn('r.endedOn', '<', knex.raw('?', to))
        if (queryParams.onlyCases) {
          this.andOn('r.resultCategory1', RESULT_CATEGORY_DETECTED_ID)
        }
        if (queryParams.onlyDrCases) {
          this.andOn('r.resultCategory2', RESULT_CATEGORY_DETECTED_ID)
        }
      })
      .join('Assay as a', 'a.id', 'r.assayId')
      .join('AssayType as at', 'at.id', 'a.assayTypeId')
      .join('Disease as d', 'd.id', 'at.diseaseId')
      .join('Disease as d', 'd.id', 'at.diseaseId')
      // .where('c.abbreviation', knex.raw("'PK'"))
      .select(knex.raw(`'${queryParams.queryDescription}' as "resultType"`))
      .select(
        knex.raw(`"" as "stateCode"`),
        knex.raw(`"Whole country" as "state"`)
      )
      .count('r.id as total')
  )
}

function buildStatsQueryByState(knex, from, to, states, queryParams) {
  let a = knex('State as s')
    .join('Geography as g', 'g.stateId', 's.id')
    .join('Country as c', 'c.id', 'g.countryId')
    .leftJoin('Result as r', function () {
      this.on('r.geographyId', 'g.id')
      this.andOn('r.endedOn', '>=', knex.raw('?', from))
      this.andOn('r.endedOn', '<', knex.raw('?', to))
      if (queryParams.onlyCases) {
        this.andOn('r.resultCategory1', RESULT_CATEGORY_DETECTED_ID)
      }
      if (queryParams.onlyDrCases) {
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
    // .where('c.abbreviation', knex.raw("'PK'"))
    .select('s.abbreviation as stateCode', 's.name as state')
    .select(knex.raw(`'${queryParams.queryDescription}' as "resultType"`))
    .groupBy('s.abbreviation')
    .orderByRaw('s.abbreviation asc, at.id asc')
    .count('r.id as total')

  console.log(a.toString())
  return a
}

module.exports = {
  getResultPakistanHandler,
}
