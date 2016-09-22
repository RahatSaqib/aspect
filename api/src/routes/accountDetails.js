let _ = require('lodash')
let camelize = require('camelize')
let decamelize = require('decamelize')
let Boom = require('boom')
let Joi = require('joi')
let { query } = require('../db')
let { asyncHandler } = require('../util')

module.exports = [
  {
    method: 'GET',
    path: '/account-details/current',
    handler: asyncHandler(getAccountDetailsForLoggedInUser),
    config: {
      description: 'Get The Person Object Linked to the Logged In User\'s Profile',
      notes: 'Returns a person object'
    }
  }, {
    method: 'POST',
    path: '/account-details/current',
    handler: asyncHandler(saveAccountDetailsForLoggedInUser),
    config: {
      description: 'Save The Person Object Linked to the Logged In User\'s Profile',
      notes: 'Returns a person object, prevents a user from trying to edit a person object not linked to their own profile',
      validate: {
        payload: {
          id: Joi.number().integer().required(),
          userId: Joi.number().integer().required(),
          username: Joi.string().required(),
          name: Joi.string().max(500).required(),
          title: Joi.string().max(255).allow('', null),
          email: Joi.string().max(500).allow('', null),
          email2: Joi.string().max(500).allow('', null),
          phone: Joi.string().max(45).allow('', null),
          cell: Joi.string().max(45).allow('', null),
          countryId: Joi.number().integer().positive().allow('', null),
          stateId: Joi.number().integer().positive().allow('', null),
          lgaId: Joi.number().integer().positive().allow('', null),
          timezone: Joi.string().max(255).allow('', null),
          culture: Joi.string().max(45).allow('', null)
        }
      }
    }
  }
]

function getAccountDetailsForUsername(username) {
  //TODO: Add migration for ZIP code
  return query('Get account details for currently logged in user').from('user as u')
    .leftJoin('person as p', 'u.id', 'p.user_id')
    .where({'u.name': username})
    .first('p.id', 'p.user_id', 'u.name as username', 'p.name', 'p.title', 'p.email', 'p.email2',
      'p.phone', 'p.cell', 'p.country_id', 'p.state_id', 'p.lga_id', 'p.timezone', 'p.culture')
}

function* getAccountDetailsForLoggedInUser(request){
  let accountDetails = yield getAccountDetailsForUsername(request.auth.credentials.name)

  let result = {ok: true, data: accountDetails}

  return camelize(result)
}

function* saveAccountDetailsForLoggedInUser(request){
  let accountDetails = yield getAccountDetailsForUsername(request.auth.credentials.name)

  //The account details do not belong to the user that submitted this request!
  if(accountDetails.id !== request.payload.id) {
    return Boom.badRequest('Incorrect user details')
  }

  //Compare the record with what has been sent and find changed values
  let changedFields = _.reduce(request.payload, function(result, value, key) {
    let fieldName = decamelize(key)
    if(!_.includes(['id', 'username'], fieldName) && fieldName in accountDetails &&
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

  let result = {ok: true, data: accountDetails}

  return camelize(result)
}
