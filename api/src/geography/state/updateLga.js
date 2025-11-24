const Boom = require('@hapi/boom')
const { transact } = require('../../db')
const { getConstraints } = require('../../auth/constraints')
const { getLga, updateGeography, getGeographyByLgaNameAndStateId } = require('./common/db')

async function updateLga({ auth, params, payload }) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { lgaId } = params
  await validate(lgaId, payload, dataConstraints)

  await transact(async trknex => {
    await updateLgaData(trknex, lgaId, payload, auth.credentials)
    await updateGeography(trknex, lgaId, payload, dataConstraints)
  })

  const data = { id: lgaId, name: payload.name }
  return { ok: true, data }
}

async function validate(lgaId, values, dataConstraints) {
  if (!values.stateId) {
    throw Boom.badRequest('State Id is required')
  }
  await validateExistingLga(lgaId, dataConstraints)
  await validateDuplicateValues(values, dataConstraints, lgaId)
}

async function validateExistingLga(lgaId, dataConstraints) {
  const lga = await getLga(lgaId, dataConstraints)
  if (!lga) {
    throw Boom.notFound('Lga not found')
  }
}

async function validateDuplicateValues(values, dataConstraints, lgaId) {
  const { name, stateId } = values
  const geoGraphies = await getGeographyByLgaNameAndStateId(name, stateId, dataConstraints)
  if (geoGraphies.length === 0) {
    return
  }
  if (geoGraphies.some(g => g.lgaId !== lgaId)) {
    throw Boom.conflict('There are lgas with the same name')
  }
}

function updateLgaData(knex, lgaId, { name }, credentials) {
  const values = { name, updatedOn: new Date(), updatedBy: credentials.personId }
  return knex('Lga').where({ id: lgaId }).update(values)
}

module.exports = { updateLga }
