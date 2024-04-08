const { knex } = require('../../../db')
const { addConstraints } = require('../../../auth/constraints')

async function getState(stateId, dataConstraints) {
  return knex('State as st').where('st.id', stateId).modify(addConstraints, dataConstraints, { state: 'st' }).first()
}

async function getStatesByValue(name, abbreviation, dataConstraints) {
  return knex('State as st')
    .where('st.name', name)
    .orWhere('st.abbreviation', abbreviation)
    .modify(addConstraints, dataConstraints, { state: 'st' })
    .select('st.id', 'st.name', 'st.abbreviation')
}

module.exports = {
  getState,
  getStatesByValue,
}
