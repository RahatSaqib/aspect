const Boom = require('@hapi/boom')
const { knex } = require('../../db')
const { getConstraints, getUserFromCredentials } = require('../../auth/constraints')
const { checkStateAccess } = require('./common/db')
const { auth } = require('../../../test/utils/testUtils')

async function updateState({ auth, params, payload }, h) {
  console.log('\x1b[1;36m', '🚀 ➜ auth:', auth)
  const { stateId } = params
  // const user = await getUserFromCredentials(auth.credentials)
  // await validate(stateId, auth.credentials, params)
  const { name, abbreviation } = payload
  await updateStateData(stateId, name, abbreviation, auth.credentials.personId)
  return h.response().code(204)
}

// const validate = async (stateId, credentials, state) => {
//   await validateConstraints(stateId, credentials)
//   // await validateNonRepeatedState(stateId, state)
// }

// async function validateConstraints(stateId, credentials) {
//   const dataConstraints = await getConstraints(credentials)

//   const checkState = await checkStateAccess(stateId, dataConstraints)

//   if (!checkState) {
//     throw Boom.notFound('State not found')
//   }
// }

function updateStateData(stateId, name, abbreviation, user) {
  const values = { name, abbreviation, updatedOn: new Date(), updatedBy: user }
  return knex('State').where({ id: stateId }).update(values)
}

// async function validateNonRepeatedState(stateId, { name, abbreviation }) {
//   const existingStates = await getStates(name, abbreviation)
//   if (existingStates && existingStates.filter(state => state.id !== stateId).length > 0) {
//     throwExistingStateError(name, abbreviation)
//   }
// }

module.exports = { updateState }
