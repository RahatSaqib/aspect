const Boom = require('@hapi/boom')
const { transact } = require('../../db')
const { getConstraints } = require('../../auth/constraints')
const { getLgasByValue, upsertGeography } = require('./common/db')

async function createLga({ auth, payload }, h) {
  const dataConstraints = await getConstraints(auth.credentials)
  await validate(payload, dataConstraints)
  let lgaId

  await transact(async trknex => {
    lgaId = await createLgaData(trknex, payload, auth.credentials)
    await upsertGeography(trknex, payload, lgaId, auth.credentials)
  })

  const data = { id: lgaId, name: payload.name }
  return h.response({ ok: true, data }).code(201)
}

async function validate(values, dataConstraints) {
  const { name } = values
  await validateDuplicateValues(name, dataConstraints)
}

async function validateDuplicateValues(name, dataConstraints) {
  const candidates = await getLgasByValue(name, dataConstraints)
  if (candidates.length > 0) {
    throw Boom.conflict('There are lgas with the same name')
  }
}

async function createLgaData(knex, { name }, credentials) {
  const values = {
    name,
    createdOn: new Date(),
    createdBy: credentials.personId,
    updatedOn: new Date(),
    updatedBy: credentials.personId,
  }
  const [id] = await knex('Lga').insert(values)
  return id
}

module.exports = { createLga }
