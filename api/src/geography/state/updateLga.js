const Boom = require('@hapi/boom')
const { transact } = require('../../db')
const { getConstraints } = require('../../auth/constraints')
const { getLga, getLgasByValue, upsertGeography } = require('./common/db')

async function updateLga({ auth, params, payload }, h) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { lgaId } = params
  await validate(lgaId, payload, dataConstraints)

  await transact(async trknex => {
    await upsertGeography(trknex, payload, lgaId, dataConstraints)
    await updateLgaData(trknex, lgaId, payload, auth.credentials)
  })

  const data = { id: lgaId, name: payload.name }
  return h.response({ ok: true, data }).code(204)
}

async function validate(lgaId, values, dataConstraints) {
  const { name } = values
  await validateExistingLga(lgaId, dataConstraints)
  await validateDuplicateValues(name, dataConstraints, lgaId)
}

async function validateExistingLga(lgaId, dataConstraints) {
  const lga = await getLga(lgaId, dataConstraints)
  if (!lga) {
    throw Boom.notFound('Lga not found')
  }
}

async function validateDuplicateValues(name, dataConstraints, lgaId) {
  const candidates = await getLgasByValue(name, dataConstraints)
  if (candidates.filter(s => s.id !== lgaId).length > 0) {
    throw Boom.conflict('There are lgas with the same name')
  }
}

function updateLgaData(knex, lgaId, { name }, credentials) {
  const values = { name, updatedOn: new Date(), updatedBy: credentials.personId }
  return knex('Lga').where({ id: lgaId }).update(values)
}

module.exports = { updateLga }
