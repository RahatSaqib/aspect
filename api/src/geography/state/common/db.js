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

async function getGeographyByLgaId(knex, lgaId, dataConstraints) {
  return knex('Geography as g').modify(addConstraints, dataConstraints, { lga: 'l' }).where('g.lgaId', lgaId).first()
}

async function upsertGeography(trknex, payload, lgaId, dataConstraints) {
  if (payload.stateId) {
    const geography = await getGeographyByLgaId(trknex, lgaId, dataConstraints)
    if (geography) {
      if (geography.stateId !== payload.stateId) {
        await trknex('Geography').where({ id: geography.id }).update({ stateId: payload.stateId })
      }
    } else {
      await trknex('Geography').insert({ stateId: payload.stateId, lgaId, countryId: dataConstraints.country.id })
    }
  }
}

module.exports = {
  getState,
  getStatesByValue,
  getLga,
  getLgasByValue,
  upsertGeography,
}
