let _ = require('lodash')
let Boom = require('boom')
let { query } = require('../db')

function getAccountDetailsForUsername(username) {
  return query('Get account details for currently logged in user').from('User as u')
    .leftJoin('Person as p', 'u.id', 'p.userId')
    .where({'u.name': username})
    .first('p.id', 'p.userId', 'u.name as username', 'p.name', 'p.title', 'p.email', 'p.email2',
      'p.phone', 'p.cell', 'p.countryId', 'p.stateId', 'p.lgaId', 'p.zip', 'p.timezone', 'p.culture')
}

function* getAccountDetailsForLoggedInUser(request){
  const accountDetails = yield getAccountDetailsForUsername(request.auth.credentials.name)

  return {ok: true, data: accountDetails}
}

function* saveAccountDetailsForLoggedInUser(request){
  let accountDetails = yield getAccountDetailsForUsername(request.auth.credentials.name)

  //The account details do not belong to the user that submitted this request!
  if(accountDetails.id !== request.payload.id) {
    return Boom.forbidden('Incorrect user details')
  }

  //Compare the record with what has been sent and find changed values
  const updatablePersonFields = ['name', 'title', 'email', 'email2', 'phone', 'cell', 'countryId', 'stateId', 'lgaId', 'zip', 'timezone', 'culture']
  const changedFields = _.reduce(request.payload, function(result, value, key) {
    if(_.includes(updatablePersonFields, key) && key in accountDetails &&
      accountDetails[key] != value) {
      result[key] = value
    }
    return result
  }, {})

  //Update record if any values have changed
  if(!_.isEmpty(changedFields)) {
    changedFields.updatedOn = new Date()
    changedFields.updatedBy = accountDetails.userId

    yield query('Save account details for currently logged in user').from('Person as p')
      .where({'p.id': accountDetails.id})
      .update(changedFields)

    accountDetails = yield getAccountDetailsForUsername(request.auth.credentials.name)
  }

  return {ok: true, data: accountDetails}
}

module.exports = {
  getAccountDetailsForLoggedInUser,
  saveAccountDetailsForLoggedInUser
}
