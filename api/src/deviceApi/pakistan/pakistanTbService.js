
const service = require('../service')

const FIXED_DATE_FROM = '2022-01-01'

const RESULT_CATEGORY_DETECTED_ID = 1

const getResultPakistanHandler = service.deviceApiHandler(getTbResultsStats, {
  deviceLogType: service.DEVICE_LOG_TYPE_RESULT,
})

async function getTbResultsStats(context) {
  // const { knex, now, device, deviceLog, deviceLogType } = context

  const { knex, now } = context

  const {
    tbTestsQuery,
    tbCasesQuery,
    drTbCasesQuery,
    tbTestsQuery24,
    tbCasesQuery24,
    drTbCasesQuery24,
  } = getCountryStats(knex)

  const {
    tbQueriesByState,
    tbCasesQueriesByState,
    drTbCasesQueriesByState,
    tbQueriesByState24,
    tbCasesQueriesByState24,
    drTbCasesQueriesByState24,
  } = await getStatesStats(knex)

  const promises = [
    tbTestsQuery,
    tbCasesQuery,
    drTbCasesQuery,
    tbTestsQuery24,
    tbCasesQuery24,
    drTbCasesQuery24,
    ...tbQueriesByState,
    ...tbCasesQueriesByState,
    ...drTbCasesQueriesByState,
    ...tbQueriesByState24,
    ...tbCasesQueriesByState24,
    ...drTbCasesQueriesByState24,
  ]
  
  const result = await Promise.all(promises)

  return { lastUpdated: now, result: result.flat() }
}

function getCountryStats(knex) {
  const { tbTestsQuery, tbCasesQuery, drTbCasesQuery } =
    getCountryStatsQueries(knex)

  tbTestsQuery.modify(filterFromFixedDateFrom)
  tbCasesQuery.modify(filterFromFixedDateFrom)
  drTbCasesQuery.modify(filterFromFixedDateFrom)

  const {
    tbTestsQuery: tbTestsQuery24,
    tbCasesQuery: tbCasesQuery24,
    drTbCasesQuery: drTbCasesQuery24,
  } = getCountryStatsQueries(knex)

  tbTestsQuery24.modify(filterLast24Hs)
  tbCasesQuery24.modify(filterLast24Hs)
  drTbCasesQuery24.modify(filterLast24Hs)

  return {
    tbTestsQuery,
    tbCasesQuery,
    drTbCasesQuery,
    tbTestsQuery24,
    tbCasesQuery24,
    drTbCasesQuery24,
  }
}

async function getStatesStats(knex) {
  let states = await getStates(knex)
  states = [{ id: 43 }, { id: 26 }] // TODO: Remove this

  const tbQueriesByState = states.map(state =>
    getTbTestsQuery(knex)
      .modify(includeState)
      .modify(qb => qb.where('s.id', state.id))
      .modify(filterFromFixedDateFrom)
  )

  const tbCasesQueriesByState = states.map(state =>
    getTbCasesQuery(knex)
      .modify(includeState)
      .modify(qb => qb.where('s.id', state.id))
      .modify(filterFromFixedDateFrom)
  )

  const drTbCasesQueriesByState = states.map(state =>
    getDrTbCasesQuery(knex)
      .modify(includeState)
      .modify(qb => qb.where('s.id', state.id))
      .modify(filterFromFixedDateFrom)
  )

  const tbQueriesByState24 = states.map(state =>
    getTbTestsQuery(knex)
      .modify(includeState)
      .modify(qb => qb.where('s.id', state.id))
      .modify(filterLast24Hs)
  )

  const tbCasesQueriesByState24 = states.map(state =>
    getTbCasesQuery(knex)
      .modify(includeState)
      .modify(qb => qb.where('s.id', state.id))
      .modify(filterLast24Hs)
  )

  const drTbCasesQueriesByState24 = states.map(state =>
    getDrTbCasesQuery(knex)
      .modify(includeState)
      .modify(qb => qb.where('s.id', state.id))
      .modify(filterLast24Hs)
  )

  return {
    tbQueriesByState,
    tbCasesQueriesByState,
    drTbCasesQueriesByState,
    tbQueriesByState24,
    tbCasesQueriesByState24,
    drTbCasesQueriesByState24,
  }
}

function getCountryStatsQueries(knex) {
  const tbTestsQuery = getTbTestsQuery(knex).modify(qb =>
    addCoutryAsStateToProjection(qb)
  )

  const tbCasesQuery = getTbCasesQuery(knex).modify(qb =>
    addCoutryAsStateToProjection(qb)
  )

  const drTbCasesQuery = getDrTbCasesQuery(knex).modify(qb =>
    addCoutryAsStateToProjection(qb)
  )

  return { tbTestsQuery, tbCasesQuery, drTbCasesQuery }

  function addCoutryAsStateToProjection(qb) {
    return qb.select(
      // knex.raw('? as ??', ['', 'stateCode'])
      knex.raw(`"" as "stateCode"`),
      knex.raw(`"whole country" as "state"`)
    )
  }
}

async function getStates(knex) {
  return knex('State as s')
    .join('Geography as g', 'g.stateId', 's.id')
    .join('Country as c', 'c.id', 'g.countryId')
    .where('c.abbreviation', 'MW')
    .select('s.id', 's.abbreviation')
}

function getTbTestsQuery(knex) {
  return buildBaseResultClause(knex).modify(applyProyection)
}

function getTbCasesQuery(knex) {
  return buildBaseResultClause(knex)
    .modify(addResultCategories)
    .where('r.resultCategory1', RESULT_CATEGORY_DETECTED_ID)
    .modify(applyProyection)
}

function getDrTbCasesQuery(knex) {
  return buildBaseResultClause(knex)
    .modify(addResultCategories)
    .where('r.resultCategory1', RESULT_CATEGORY_DETECTED_ID)
    .where('r.resultCategory2', RESULT_CATEGORY_DETECTED_ID)
    .modify(applyProyection)
}

function filterLast24Hs(queryBuilder) {
  queryBuilder.whereRaw('r.endedOn >= ?', FIXED_DATE_FROM)
  queryBuilder.whereRaw('r.endedOn <= ?', '2022-01-23')
  return queryBuilder
}

function filterFromFixedDateFrom(queryBuilder) {
  queryBuilder.whereRaw('r.endedOn >= ?', FIXED_DATE_FROM)
  queryBuilder.whereRaw('r.endedOn <= ?', '2022-01-23')
  return queryBuilder
}

function applyProyection(queryBuilder) {
  return queryBuilder
    .select(
      'd.name as disease',
      'd.externalId as diseaseCode',
      'a.name as assayName',
      'a.externalId as assayId'
    )
    .count('r.id as total')
}

function buildBaseResultClause(knex) {
  return knex('Assay as a')
    .join('AssayType as at', 'at.id', 'a.assayTypeId')
    .leftJoin('Result as r', 'r.assayId', 'a.id')
    .join('Disease as d', 'd.id', 'at.diseaseId')
    .where('d.externalId', 'tb')
    .groupBy('at.diseaseId', 'a.id')
}

function includeState(queryBuilder) {
  queryBuilder
    .join('Geography as g', 'g.id', 'r.geographyId')
    // .join('Country as c', 'c.id', 'g.countryId')
    .join('State as s', 's.id', 'g.stateId')
    // .where('c.abbreviation', 'PK')
    .select('s.abbreviation as stateCode', 's.name as state')
    .groupBy('s.id')
  return queryBuilder
}

function addResultCategories(queryBuilder) {
  queryBuilder
    .join('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .join('ResultCategory as rc2', 'rc2.id', 'r.resultCategory2')
  return queryBuilder
}

module.exports = {
  getResultPakistanHandler,
}
