const Boom = require('@hapi/boom')
const { transact } = require('../../db')
const { getConstraints } = require('../../auth/constraints')
const { createGeography, getGeographyByLgaNameAndStateId } = require('./common/db')

async function createLga({ auth, payload }, h) {
  const dataConstraints = await getConstraints(auth.credentials)
  const existingLgas = await getGeographyByLgaNameAndStateId(payload.name, payload.stateId, dataConstraints)

  if (existingLgas.length > 0) {
    throw Boom.conflict('There are lgas with the same name')
  }

  let lgaId

  await transact(async trknex => {
    lgaId = await createLgaData(trknex, payload, auth.credentials)
    await createGeography(trknex, payload, lgaId, dataConstraints)
  })

  const data = { id: lgaId, name: payload.name }
  return h.response({ ok: true, data }).code(201)
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
