const _ = require('lodash')
const Boom = require('boom')
const { query } = require('../db')
const { transformGeographyFromUpdates } = require('../geography/service')

function getAccountDetailsForUsername(username) {
  return query('Get account details for currently logged in user')
    .from('User as u')
    .leftJoin('Person as p', 'u.id', 'p.userId')
    .leftOuterJoin('Geography as g', 'g.id', 'p.geographyId')
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
      'p.culture'
    )
}

function* getAccountDetailsForLoggedInUser(request) {
  const accountDetails = yield getAccountDetailsForUsername(
    request.auth.credentials.name
  )

  return { ok: true, data: accountDetails }
}

function* saveDetailsForLoggedInUser(request, updatablePersonFields) {
  const username = request.auth.credentials.name
  const newAccountDetails = request.payload

  let accountDetails = yield getAccountDetailsForUsername(username)

  // The account details do not belong to the user that submitted this request!
  if (accountDetails.id !== newAccountDetails.id) {
    return Boom.forbidden('Incorrect user details')
  }
  // Compare the record with what has been sent and find changed values
  const changedFields = _.reduce(
    newAccountDetails,
    (result, value, key) => {
      if (
        _.includes(updatablePersonFields, key) &&
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
  const changedPersonFields = yield* transformGeographyFromUpdates(
    changedFields
  )

  if (!_.isEmpty(changedPersonFields)) {
    changedPersonFields.updatedOn = new Date()
    changedPersonFields.updatedBy = accountDetails.userId

    yield query('Save account details for currently logged in user')
      .from('Person as p')
      .where({ 'p.id': accountDetails.id })
      .update(changedPersonFields)
    accountDetails = yield getAccountDetailsForUsername(username)
  }

  return { ok: true, data: accountDetails }
}

function* saveContactDetailsForLoggedInUser(request) {
  return yield* saveDetailsForLoggedInUser(request, [
    'name',
    'title',
    'email',
    'email2',
    'phone',
    'cell',
    'countryId',
    'stateId',
    'lgaId',
    'zip',
  ])
}

function* saveUserPreferencesForLoggedInUser(request) {
  return yield* saveDetailsForLoggedInUser(request, ['timezone', 'culture'])
}

module.exports = {
  getAccountDetailsForLoggedInUser,
  saveContactDetailsForLoggedInUser,
  saveUserPreferencesForLoggedInUser,
}
