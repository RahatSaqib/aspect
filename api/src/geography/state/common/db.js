const { knex } = require('../../../db')
const { addConstraints } = require('../../../auth/constraints')

async function getState(stateId, dataConstraints) {
  return knex('State as st').where('st.id', stateId).modify(addConstraints, dataConstraints, { state: 'st' }).first()
}

async function getLga(lgaId, dataConstraints) {
  return knex('Lga as l').where('l.id', lgaId).modify(addConstraints, dataConstraints, { lga: 'l' }).first()
}

async function getStatesByValue(name, abbreviation, dataConstraints) {
  return knex('State as st')
    .where('st.name', name)
    .orWhere('st.abbreviation', abbreviation)
    .modify(addConstraints, dataConstraints, { state: 'st' })
    .select('st.id', 'st.name', 'st.abbreviation')
}

async function getLgasByValue(name, dataConstraints) {
  return knex('Lga as l')
    .where('l.name', name)
    .modify(addConstraints, dataConstraints, { lga: 'l' })
    .select('l.id', 'l.name')
}

module.exports = {
  getState,
  getStatesByValue,
  getLga,
  getLgasByValue,
}
