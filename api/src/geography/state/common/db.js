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

async function getGeographyByLgaAndStateId(lgaId, stateId, dataConstraints) {
  return knex('Geography as g')
    .modify(addConstraints, dataConstraints, { lga: 'l' })
    .where('g.lgaId', lgaId)
    .where('g.stateId', stateId)
    .where('g.countryId', dataConstraints.country.id)
    .first()
}

async function getGeographyByLgaNameAndStateId(name, stateId, dataConstraints) {
  return knex('Geography as g')
    .join('Lga as l', 'l.id', 'g.lgaId')
    .modify(addConstraints, dataConstraints, { lga: 'l' })
    .where('l.name', name)
    .where('g.stateId', stateId)
    .where('g.countryId', dataConstraints.country.id)
    .select('g.id', 'g.stateId', 'g.lgaId')
}

async function updateGeography(trknex, lgaId, payload, dataConstraints) {
  await trknex('Geography')
    .modify(addConstraints, dataConstraints, { lga: 'l' })
    .where({ lgaId })
    .update({ stateId: payload.stateId })
}

async function upsertGeography(trknex, payload, lgaId, dataConstraints) {
  if (payload.stateId) {
    const geography = await getGeographyByLgaAndStateId(lgaId, payload.stateId, dataConstraints)
    if (geography) {
      if (geography.stateId !== payload.stateId) {
        await trknex('Geography').where({ id: geography.id }).update({ stateId: payload.stateId })
      }
    } else {
      await trknex('Geography').insert({ stateId: payload.stateId, lgaId, countryId: dataConstraints.country.id })
    }
  }
}

async function createGeography(trknex, payload, lgaId, dataConstraints) {
  const [geography] = await trknex('Geography').insert({
    stateId: payload.stateId,
    lgaId,
    countryId: dataConstraints.country.id,
  })
  return geography.id
}

module.exports = {
  getState,
  getStatesByValue,
  getLga,
  upsertGeography,
  getGeographyByLgaAndStateId,
  getGeographyByLgaNameAndStateId,
  createGeography,
  updateGeography,
}
