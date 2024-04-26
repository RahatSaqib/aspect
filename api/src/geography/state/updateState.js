const Boom = require('@hapi/boom')
const { knex } = require('../../db')
const { getConstraints } = require('../../auth/constraints')
const { getState, getStatesByValue } = require('./common/db')

async function updateState({ auth, params, payload }) {
  const { stateId } = params

  await validate(stateId, payload, auth.credentials)
  await updateStateData(stateId, payload, auth.credentials)

  const data = { id: stateId, name: payload.name, abbreviation: payload.abbreviation }
  return { ok: true, data }
}

const validate = async (stateId, { name, abbreviation }, credentials) => {
  const dataConstraints = await getConstraints(credentials)
  await validateExistingState(stateId, dataConstraints)
  await validateDuplicateValues(name, abbreviation, dataConstraints, stateId)
}

async function validateExistingState(stateId, dataConstraints) {
  const state = await getState(stateId, dataConstraints)
  if (!state) {
    throw Boom.notFound('State not found')
  }
}

async function validateDuplicateValues(name, abbreviation, dataConstraints, stateId) {
  const candidates = await getStatesByValue(name, abbreviation, dataConstraints)
  if (candidates.filter(s => s.id !== stateId).length > 0) {
    throw Boom.conflict('There are states with the same name or abbreviation')
  }
}

function updateStateData(stateId, { name, abbreviation }, credentials) {
  const values = { name, abbreviation, updatedOn: new Date(), updatedBy: credentials.personId }
  return knex('State').where({ id: stateId }).update(values)
}

module.exports = { updateState }
