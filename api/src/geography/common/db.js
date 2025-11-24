const { knex } = require('../../db')
const { addConstraints } = require('../../auth/constraints')

async function getAllGeographiesWithNames(dataConstraints) {
  // Get all geographies with country, state and lga names
  return knex('Geography as g')
    .innerJoin('Country as c', 'c.id', 'g.countryId')
    .leftJoin('State as s', 's.id', 'g.stateId')
    .leftJoin('Lga as l', 'l.id', 'g.lgaId')
    .modify(addConstraints, dataConstraints, { geography: 'g' })
    .orderBy(['c.name', 's.name', 'l.name'], 'asc')
    .select(
      'c.id as countryId',
      'c.name as country',
      's.id as stateId',
      's.name as state',
      'l.id as lgaId',
      'l.name as lga'
    )
}

module.exports = {
  getAllGeographiesWithNames,
}
