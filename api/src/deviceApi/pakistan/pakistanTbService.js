const {
  getConstraintsByDeviceAPIKey,
  addConstraints,
} = require('../../auth/constraints')
const service = require('../service')

const RESULT_CATEGORY_DETECTED_ID = 1

const getResultPakistanHandler = service.deviceApiHandler(getTbResultsStats, {
  deviceLogType: service.DEVICE_LOG_TYPE_NONE,
})

async function getTbResultsStats(context) {
  const {
    knex,
    device: { token: apiKey },
  } = context

  const { from, to } = context.query
  const constraints = await getConstraintsByDeviceAPIKey(apiKey)

  const countryQuery = getTbResultsStatsQuery(knex, constraints, from, to)
  const statesQuery = getTbResultsStatsQueryByState(knex, constraints, from, to)

  const [country, states] = await Promise.all([countryQuery, statesQuery])

  return { from, to, total: country[0], states }
}

function getTbResultsStatsQueryByState(knex, constraints, from, to) {
  const baseQuery = getTbResultsStatsQuery(knex, constraints, from, to)

  const query = knex('State as s')
    .leftJoin(
      knex('Geography as g').distinct('countryId', 'stateId').as('g'),
      function () {
        this.on({ 'g.stateId': 's.id' })
      }
    )
    .leftJoin(
      baseQuery.as('b').groupBy('g.stateId').select('g.stateId'),
      function () {
        this.on({ 'b.stateId': 's.id' })
      }
    )
    .modify(addConstraints, constraints, {
      geography: 'g',
    })
    .select(
      knex.raw(`coalesce(s.abbreviation,'') as stateCode`),
      's.name as state',
      knex.raw('coalesce(b.tests,0) as tests'),
      knex.raw('coalesce(b.cases, 0) as cases'),
      knex.raw('coalesce(b.drCases, 0) as drCases')
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
    .modify(addConstraints, constraints, {
      result: 'r',
      geography: 'g',
      device: 'dev',
    })
    .where({ 'd.externalId': knex.raw("'tb'") })
    .where('r.endedOn', '>=', knex.raw('?', from))
    .where('r.endedOn', '<', knex.raw('?', to))
    .select(
      knex.raw('count(r.id) as tests'),
      knex.raw(
        `coalesce(sum(case coalesce(r.resultcategory1,-1) when ${RESULT_CATEGORY_DETECTED_ID} then 1 else 0 end),0) as cases`
      ),
      knex.raw(
        `coalesce(sum(case 
              when coalesce(r.resultcategory1,-1) = ${RESULT_CATEGORY_DETECTED_ID} 
                   and coalesce(r.resultcategory2,-1) = ${RESULT_CATEGORY_DETECTED_ID} 
                then 1 else 0 
              end),0) as drCases`
      )
    )
}

module.exports = {
  getResultPakistanHandler,
}
