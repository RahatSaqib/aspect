const _ = require('lodash')
const { knex } = require('../db')
const { getConstraints } = require('../auth/constraints')
const userService = require('../auth/service')
const { transformGeographyFromUpdates } = require('../geography/service')
const { updateTagsById } = require('../tag/service')
const { getPersonDetails } = require('./common/db')

async function createPerson(request) {
  const { payload, auth } = request

  _.mapKeys(payload, (value, key) => {
    if (value === '') {
      _.set(payload, `${key}`, null)
    }
  })

  const currentlyLoggedInUser = await userService.getUser(request.auth.credentials.name)

  const changedFields = {
    // 'payload' contains at least one required field - 'name'
    ...payload,
    // add other required fields
    ..._.pick(currentlyLoggedInUser, ['timezone', 'culture']),
    createdOn: new Date(),
    updatedOn: new Date(),
    createdBy: currentlyLoggedInUser.id,
    updatedBy: currentlyLoggedInUser.id,
  }

  const changedPersonFields = await transformGeographyFromUpdates(changedFields, currentlyLoggedInUser.countryId)
  if (changedFields.countryId) {
    changedPersonFields.lastCountryId = changedFields.countryId
  }

  const changedPersonFieldsWithoutTags = _.omit(changedPersonFields, 'tags')

  const [personId] = await knex('Person').insert(changedPersonFieldsWithoutTags)
  if (changedPersonFields?.tags) {
    await updateTagsById(personId, 'person', changedPersonFields.tags, auth)
    changedPersonFieldsWithoutTags.updatedOn = new Date()
  }
  const dataConstraints = await getConstraints(auth.credentials)
  const personDetails = await getPersonDetails(personId, dataConstraints)
  personDetails.jobFunctions = []

  return { ok: true, data: personDetails }
}

module.exports = {
  createPerson,
}
