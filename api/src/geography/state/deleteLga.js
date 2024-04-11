const Boom = require('@hapi/boom')
const { knex } = require('../../db')
const { getConstraints } = require('../../auth/constraints')
const { getLga } = require('./common/db')

async function deleteLga({ auth, params }, h) {
  const { lgaId } = params

  await validate(lgaId, auth.credentials)

  try {
    await deleteLgaData(lgaId)
  } catch (e) {
    return h.response({ ok: false }).code(409)
  }

  return h.response({ ok: true }).code(204)
}

const validate = async (lgaId, credentials) => {
  const dataConstraints = await getConstraints(credentials)
  await validateExistingLga(lgaId, dataConstraints)
}

async function validateExistingLga(lgaId, dataConstraints) {
  const lga = await getLga(lgaId, dataConstraints)
  if (!lga) {
    throw Boom.notFound('Lga not found')
  }
}

async function deleteLgaData(lgaId) {
  await knex('Geography').where({ lgaId }).delete()
  await knex('Lga').where({ id: lgaId }).delete()
}

module.exports = { deleteLga }
