const _ = require('lodash')
const Boom = require('@hapi/boom')
const { knex, query } = require('../db')
const { transformGeographyFromUpdates } = require('../geography/service')
const { updateTagsById, tagsAreEqual } = require('../tag/service')
const { getUserFromCredentials } = require('../auth/constraints')

function getAccountDetailsForUsername(username) {
  return query('Get account details for currently logged in user')
    .from('User as u')
    .leftJoin('Person as p', 'u.id', 'p.userId')
    .leftJoin('Geography as g', 'g.id', 'p.geographyId')
    .leftJoin('PersonTag as pt', 'pt.personId', 'p.id')
    .leftJoin('Tag as t', 'pt.tagId', 't.id')
    .where({ 'u.name': username })
    .first(
      'p.id',
      'p.userId',
      'u.name as username',
      'p.name',
      'p.title',
      'p.email',
      'p.email2',
      'p.phone',
      'p.cell',
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      'p.zip',
      'p.timezone',
      'p.culture',
      knex.raw(`GROUP_CONCAT(t.title) as tags`)
    )
}

async function getAccountDetailsForLoggedInUser(request) {
  const accountDetails = await getAccountDetailsForUsername(request.auth.credentials.name)
  return { ok: true, data: accountDetails }
}

async function saveDetailsForLoggedInUser(request, updatablePersonFields) {
  const { payload: newAccountDetails, auth } = request
  const username = auth.credentials.name
  let accountDetails = await getAccountDetailsForUsername(username)
  const user = await getUserFromCredentials(auth.credentials)

  _.mapKeys(newAccountDetails, (value, key) => {
    if (value === '') {
      _.set(newAccountDetails, `${key}`, null)
    }
  })

  // The account details do not belong to the user that submitted this request!
  if (accountDetails.id !== newAccountDetails.id) {
    return Boom.forbidden('Incorrect user details')
  }
  // Compare the record with what has been sent and find changed values
  const changedFields = _.reduce(
    newAccountDetails,
    (result, value, key) => {
      if (
        _.includes(
          updatablePersonFields.filter(f => f !== 'tags'),
          key
        ) &&
        key in accountDetails &&
        accountDetails[key] !== value
      ) {
        result[key] = value
      }
      return result
    },
    {}
  )

  // Update record if any values have changed
  const changedPersonFields = await transformGeographyFromUpdates(changedFields, user.countryId)

  const changedTags = !tagsAreEqual(newAccountDetails.tags, accountDetails.tags)
  if (changedTags) {
    await updateTagsById(accountDetails.id, 'person', newAccountDetails.tags, auth)
    changedPersonFields.updatedOn = new Date()
  }

  if (!_.isEmpty(changedPersonFields)) {
    changedPersonFields.updatedOn = new Date()
    changedPersonFields.updatedBy = accountDetails.userId

    await query('Save account details for currently logged in user')
      .from('Person as p')
      .where({ 'p.id': accountDetails.id })
      .update(changedPersonFields)
    accountDetails = await getAccountDetailsForUsername(username)
  }

  return { ok: true, data: accountDetails }
}

async function saveContactDetailsForLoggedInUser(request) {
  const response = await saveDetailsForLoggedInUser(request, [
    'name',
    'title',
    'email',
    'email2',
    'phone',
    'cell',
    'culture',
    'countryId',
    'stateId',
    'lgaId',
    'zip',
    'timezone',
    'tags',
  ])
  return response
}

async function saveUserPreferencesForLoggedInUser(request) {
  const response = await saveDetailsForLoggedInUser(request, ['timezone', 'culture'])
  return response
}

module.exports = {
  getAccountDetailsForLoggedInUser,
  saveContactDetailsForLoggedInUser,
  saveUserPreferencesForLoggedInUser,
  getAccountDetailsForUsername,
}
