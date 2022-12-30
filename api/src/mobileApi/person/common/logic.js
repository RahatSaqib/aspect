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

// only return changed fields of person details
const getChangedFields = (payload, personDetails) => {
  const value = getTimezoneInIanaWindows(payload, personDetails)
  const data = { ...payload, ...{ timezone: value } }
  const changedFields = {}
  _.map(data, (value, key) => {
    if (key in personDetails && personDetails[key] !== (value || personDetails.defaultTimezone)) {
      changedFields[key] = value
    }
  })
  return changedFields
}

// return timezone in IanaWindows format standard time
const getTimezoneInIanaWindows = (payload, personDetails) => {
  const [value] = findWindows(payload?.timezone)
  let timezoneValue = payload.timezone
  switch (payload.timezone) {
    case null:
      timezoneValue = personDetails.defaultTimezone
      break

    case '':
      timezoneValue = personDetails.defaultTimezone
      break

    default:
      timezoneValue = value
      break
  }
  return timezoneValue
}

module.exports = { getPersonDetails, getChangedFields }
