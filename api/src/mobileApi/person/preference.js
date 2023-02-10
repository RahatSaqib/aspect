const _ = require('lodash')
const Boom = require('@hapi/boom')
const { getUser } = require('../../auth/service')
const { updatePersonDetail } = require('./common/db')
const { getPersonDetails, getChangedFields } = require('./common/logic')

async function updatePersonUserPreferences(request) {
  const { payload } = request
  _.mapKeys(payload, (value, key) => {
    if (value === '') {
      _.set(payload, `${key}`, null)
    }
  })

  const currentlyLoggedInUser = await getUser(request.auth.credentials.name)
  const personDetails = await getPersonDetails(request)
  if (_.isEmpty(personDetails)) {
    return Boom.notFound()
  }

  // get list of fileds changed from existing value
  const changedPersonFields = getChangedFields(payload, personDetails)

  // update person details if we have any changed filed
  if (!_.isEmpty(changedPersonFields)) {
    changedPersonFields.updatedOn = new Date()
    changedPersonFields.updatedBy = currentlyLoggedInUser.id
    await updatePersonDetail(personDetails.id, changedPersonFields)
  }

  const details = await getPersonDetails(request)
  return {
    ok: !!details,
    data: details,
  }
}

module.exports = {
  updatePersonUserPreferences,
}
