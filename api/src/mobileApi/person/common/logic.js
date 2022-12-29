const _ = require('lodash')
const Boom = require('@hapi/boom')
const { findWindows } = require('windows-iana')
const { getConstraints } = require('../../../auth/constraints')
const { getPersonDetailsById } = require('./db')

async function getPersonDetails(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const personDetails = await getPersonDetailsById(dataConstraints.person.id, dataConstraints)
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
        if (key === 'timezone') {
          if (!value) {
            value = 'America/New_York'
          }
          const [ianaWindowsTimezone] = findWindows(value)
          result[key] = ianaWindowsTimezone ? findWindows(value) : value
        } else {
          result[key] = value
        }
      }
      return result
    },
    {}
  )
}

module.exports = { getPersonDetails, getChangedFields }
