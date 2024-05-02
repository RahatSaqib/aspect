const Boom = require('@hapi/boom')
const { transact } = require('../../db')
const { getConstraints } = require('../../auth/constraints')
const { getLga } = require('./common/db')

async function deleteLga({ auth, params }) {
  const { lgaId } = params

  await validate(lgaId, auth.credentials)

  try {
    await deleteLgaData(lgaId)
  } catch (e) {
    throw Boom.conflict('Unable to delete LGA, as there are associated entities with it.')
  }

  return { ok: true }
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
  await transact(async trknex => {
    await trknex('Geography').where({ lgaId }).delete()
    await trknex('Lga').where({ id: lgaId }).delete()
  })
}

module.exports = { deleteLga }
