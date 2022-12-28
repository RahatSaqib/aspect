const _ = require('lodash')
const Boom = require('@hapi/boom')
const { getConstraints } = require('../../../auth/constraints')
const { getPersonDetailsById } = require('./db')

async function getPersonDetails(request) {
  const { params, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const personDetails = await getPersonDetailsById(params.personId, dataConstraints)
  if (_.isEmpty(personDetails)) {
    return Boom.notFound()
  }

  return personDetails
}

const getChangedFields = (payload, updatablePersonFields, personDetails) => {
  return _.reduce(
    payload,
    (result, value, key) => {
      if (
        _.includes(
          updatablePersonFields.filter(f => f !== 'tags'),
          key
        ) &&
        key in personDetails &&
        personDetails[key] !== value
      ) {
        result[key] = value
      }
      return result
    },
    {}
  )
}

module.exports = { getPersonDetails, getChangedFields }
