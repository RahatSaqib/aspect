const Boom = require('@hapi/boom')
const { transact } = require('../../db')
const { addConstraints, getConstraints } = require('../../auth/constraints')
const { getLga, getLgasByValue } = require('./common/db')

async function updateLga({ auth, params, payload }, h) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { lgaId } = params
  await validate(lgaId, payload, dataConstraints)

  await transact(async trknex => {
    await upsertGeography(trknex, payload, lgaId, auth.credentials)

    await updateLgaData(trknex, lgaId, payload, auth.credentials)
  })

  return h.response().code(204)
}

async function upsertGeography(trknex, payload, lgaId, credentials) {
  if (payload.stateId) {
    const geography = await getGeographyByLgaId(trknex, lgaId, credentials)
    if (geography) {
      if (geography.stateId !== payload.stateId) {
        await trknex('Geography').where({ id: geography.id }).update({ stateId: payload.stateId })
      }
    } else {
      await trknex('Geography').insert({ stateId: payload.stateId, lgaId, countryId: credentials.countryId })
    }
  }
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

async function getGeographyByLgaId(knex, lgaId, dataConstraints) {
  return knex('Geography as g').modify(addConstraints, dataConstraints, { lga: 'l' }).where('g.lgaId', lgaId).first()
}

function updateLgaData(knex, lgaId, { name }, credentials) {
  const values = { name, updatedOn: new Date(), updatedBy: credentials.personId }
  return knex('Lga').where({ id: lgaId }).update(values)
}

module.exports = { updateLga }
