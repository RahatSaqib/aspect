const _ = require('lodash')
const { knex } = require('../db')

function getPeopleBase() {
  return knex('Person as p')
    .leftJoin('Geography as g', 'p.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('JobContext as jc', 'jc.personId', 'p.id')
    .leftJoin('Site as s', 'jc.siteId', 's.id')
}

async function hasCountryLevelPermission(constraints) {
  const countries = _.compact(constraints.$or.reduce((p, c) => [...p, c?.geography?.countryId], []))
  if (countries.length === 0) return false

  const jobFunctionsId = _.compact(constraints.$or.reduce((p, c) => [...p, c?.jobFunction?.id], []))

  const permissions = await knex('JobFunctionPermission as jfp')
    .leftJoin('Permission as p', 'jfp.permissionId', 'p.id')
    .whereIn('jfp.jobFunctionId', jobFunctionsId)
    .select('p.module', 'p.activity')
    .then(rows => rows?.map(r => `${r.module}:${r.activity}`))

  return _.some(permissions, p => ['person:edit', 'person:admin'].includes(p) || p.startsWith('admin'))
}

module.exports = {
  getPeopleBase,
  hasCountryLevelPermission,
}
