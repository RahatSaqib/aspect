let _ = require('lodash')
let camelize = require('camelize')
let decamelize = require('decamelize')
let Boom = require('boom')
let { query, knex } = require('../db')

function getAccountDetailsForUsername(username) {
  //TODO: Add migration for ZIP code
  return query('Get account details for currently logged in user').from('user as u')
    .leftJoin('person as p', 'u.id', 'p.user_id')
    .where({'u.name': username})
    .first('p.id', 'p.user_id', 'u.name as username', 'p.name', 'p.title', 'p.email', 'p.email2',
      'p.phone', 'p.cell', 'p.country_id', 'p.state_id', 'p.lga_id', 'p.timezone', 'p.culture',
      knex.raw('\'12345\' as zip'))
}

function* getAccountDetailsForLoggedInUser(request){
  const accountDetails = yield getAccountDetailsForUsername(request.auth.credentials.name)

  const result = {ok: true, data: accountDetails}

  return camelize(result)
}

function* saveAccountDetailsForLoggedInUser(request){
  let accountDetails = yield getAccountDetailsForUsername(request.auth.credentials.name)

  //The account details do not belong to the user that submitted this request!
  if(accountDetails.id !== request.payload.id) {
    return Boom.badRequest('Incorrect user details')
  }

  //Compare the record with what has been sent and find changed values
  const changedFields = _.reduce(request.payload, function(result, value, key) {
    const fieldName = decamelize(key)
    if(!_.includes(['id', 'username', 'zip'], fieldName) && fieldName in accountDetails &&
      accountDetails[fieldName] != value) {
      result[fieldName] = value
    }
    return result
  }, {})

  //Update record if any values have changed
  if(!_.isEmpty(changedFields)) {
    changedFields.updated_on = new Date()
    changedFields.updated_by = accountDetails.user_id

    yield query('Save account details for currently logged in user').from('person as p')
      .where({'p.id': accountDetails.id})
      .update(changedFields)

    accountDetails = yield getAccountDetailsForUsername(request.auth.credentials.name)
  }

  const result = {ok: true, data: accountDetails}

  return camelize(result)
}

module.exports = {
  getAccountDetailsForLoggedInUser,
  saveAccountDetailsForLoggedInUser
}
