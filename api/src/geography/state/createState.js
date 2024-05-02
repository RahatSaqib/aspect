const Boom = require('@hapi/boom')
const { transact } = require('../../db')
const { getConstraints } = require('../../auth/constraints')
const { getStatesByValue } = require('./common/db')

async function createState({ auth, payload }, h) {
  const dataConstraints = await getConstraints(auth.credentials)
  await validate(payload, dataConstraints)
  let stateId

  await transact(async trknex => {
    stateId = await createStateData(trknex, payload, auth.credentials)
    await trknex('Geography').insert({ countryId: dataConstraints.country.id, stateId })
  })

  const data = { id: stateId, name: payload.name, abbreviation: payload.abbreviation }
  return h.response({ ok: true, data }).code(201)
}

async function validate(values, dataConstraints) {
  const { name, abbreviation } = values
  await validateDuplicateValues(name, abbreviation, dataConstraints)
}

async function validateDuplicateValues(name, abbreviation, dataConstraints) {
  const candidates = await getStatesByValue(name, abbreviation, dataConstraints)
  if (candidates.length > 0) {
    throw Boom.conflict('There are states with the same name or abbreviation')
  }
}

async function createStateData(knex, { name, abbreviation }, credentials) {
  const values = {
    name,
    abbreviation,
    createdOn: new Date(),
    createdBy: credentials.personId,
    updatedOn: new Date(),
    updatedBy: credentials.personId,
  }
  const [id] = await knex('State').insert(values)
  return id
}

module.exports = { createState }
