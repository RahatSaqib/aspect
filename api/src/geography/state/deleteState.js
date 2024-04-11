const Boom = require('@hapi/boom')
const { knex } = require('../../db')
const { getConstraints } = require('../../auth/constraints')
const { getState } = require('./common/db')

async function deleteState({ auth, params }, h) {
  const { stateId } = params

  await validate(stateId, auth.credentials)

  try {
    await deleteStateData(stateId)
  } catch (e) {
    return h.response({ ok: false }).code(409)
  }

  return h.response({ ok: true }).code(204)
}

const validate = async (stateId, credentials) => {
  const dataConstraints = await getConstraints(credentials)
  await validateExistingState(stateId, dataConstraints)
}

async function validateExistingState(stateId, dataConstraints) {
  const state = await getState(stateId, dataConstraints)
  if (!state) {
    throw Boom.notFound('State not found')
  }
}

async function deleteStateData(stateId) {
  await knex('Geography').where({ stateId, lgaId: null }).delete()
  await knex('State').where({ id: stateId }).delete()
}

module.exports = { deleteState }
