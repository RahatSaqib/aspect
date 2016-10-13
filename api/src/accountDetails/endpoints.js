let Joi = require('joi')
let { asyncHandler } = require('../routes')
let {getAccountDetailsForLoggedInUser, saveAccountDetailsForLoggedInUser} = require('./service')

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
    method: 'PUT',
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
          zip: Joi.string().max(45).allow('', null),
          timezone: Joi.string().max(255).allow('', null),
          culture: Joi.string().max(45).allow('', null)
        }
      }
    }
  }
]
