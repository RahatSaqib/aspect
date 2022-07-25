const { getConstraintsByDeviceAPIKey, addConstraints } = require('../../auth/constraints')

async function getTbResultsStats(context) {
  const {
    knex,
    device: { token: apiKey },
  } = context

  const { from, to } = context.query
  const constraints = await getConstraintsByDeviceAPIKey(apiKey)

  const countryQuery = getTbResultsQueryWholeCountry(knex, constraints, from, to)
  const statesQuery = getTbResultsStatsQueryByState(knex, constraints, from, to)

  const [[countryTotals], stateTotals] = await Promise.all([countryQuery, statesQuery])

  return { from, to, countryTotals, stateTotals }
}

function getTbResultsStatsQueryByState(knex, constraints, from, to) {
  const baseQuery = getTbResultsStatsQuery(knex, constraints, from, to).clone()

  const query = knex('State as s')
    .leftJoin(baseQuery.as('b'), builder => builder.on({ 'b.stateId': 's.id' }))
    .whereIn(
      's.id',
      knex.raw('(?)', knex('Geography as g').where('g.countryId', constraints.country.id).pluck('stateId').distinct())
    )
    .select(
      knex.raw(`coalesce(s.abbreviation,'') as stateCode`),
      's.name as state',
      knex.raw('coalesce(b.tests,0) as tests'),
      knex.raw('coalesce(b.cases, 0) as cases'),
      knex.raw('coalesce(b.drCases, 0) as drCases')
    )
    .groupBy('s.name')
  return query
}

function getTbResultsQueryWholeCountry(knex, constraints, from, to) {
  const baseQuery = getTbResultsStatsQuery(knex, constraints, from, to).clone()

  const query = knex('State as s')
    .leftJoin(baseQuery.as('b'), builder => builder.on({ 'b.stateId': 's.id' }))
    .whereIn(
      's.id',
      knex.raw('(?)', knex('Geography as g').where('g.countryId', constraints.country.id).pluck('stateId').distinct())
    )
    .select(
      knex.raw('sum(coalesce(b.tests,0)) as tests'),
      knex.raw('sum(coalesce(b.cases, 0)) as cases'),
      knex.raw('sum(coalesce(b.drCases, 0)) as drCases')
    )
  return query
}

function getTbResultsStatsQuery(knex, constraints, from, to) {
  return knex('Result as r')
    .join('Device as dev', 'dev.id', 'r.deviceId')
    .join('Assay as a', 'a.id', 'r.assayId')
    .join('AssayType as at', 'at.id', 'a.assayTypeId')
    .join('Disease as d', 'd.id', 'at.diseaseId')
    .join('Geography as g', 'g.id', 'r.geographyId')
    .join('ResultCategory as rcDetected', 'rcDetected.id', 'r.resultCategory1')
    .leftJoin('ResultCategory as rcDr', 'rcDr.id', 'r.resultCategory2')
    .modify(addConstraints, constraints, {
      result: 'r',
      geography: 'g',
      device: 'dev',
    })
    .where({ 'd.externalId': knex.raw("'tb'") })
    .where('r.endedOn', '>=', from)
    .where('r.endedOn', '<', knex.raw('?', to))
    .select(
      'g.stateId',
      knex.raw('count(r.id) as tests'),
      knex.raw(`coalesce(sum(case coalesce(rcDetected.externalId,-1) when 'Detected' then 1 else 0 end),0) as cases`),
      knex.raw(
        `coalesce(sum(case 
              when rcDetected.externalId = 'Detected' 
                   and rcDr.externalId = 'Detected'
                then 1 else 0 
              end),0) as drCases`
      )
    )
    .groupBy('g.stateId')
}

module.exports = {
  getTbResultsStats,
}
