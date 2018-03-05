const Joi = require('joi')
const { asyncHandler } = require('../routes')
const {
  getAccountDetailsForLoggedInUser,
  saveContactDetailsForLoggedInUser,
  saveUserPreferencesForLoggedInUser,
} = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/account-details/current',
    handler: asyncHandler(getAccountDetailsForLoggedInUser),
    config: {
      description:
        "Get The Person Object Linked to the Logged In User's Profile",
      notes: 'Returns a person object',
    },
  },
  {
    method: 'PUT',
    path: '/account-details/current-contact',
    handler: asyncHandler(saveContactDetailsForLoggedInUser),
    config: {
      description:
        "Save the General and Contact Details of the Person Object Linked to the Logged In User's Profile",
      notes:
        'Returns a person object, prevents a user from trying to edit a person object not linked to their own profile',
      validate: {
        payload: {
          id: Joi.number()
            .integer()
            .required(),
          name: Joi.string()
            .max(500)
            .required(),
          title: Joi.string()
            .max(255)
            .allow('', null),
          email: Joi.string()
            .max(500)
            .allow('', null),
          email2: Joi.string()
            .max(500)
            .allow('', null),
          phone: Joi.string()
            .max(45)
            .allow('', null),
          cell: Joi.string()
            .max(45)
            .allow('', null),
          countryId: Joi.number()
            .integer()
            .positive()
            .allow('', null),
          stateId: Joi.number()
            .integer()
            .positive()
            .allow('', null),
          lgaId: Joi.number()
            .integer()
            .positive()
            .allow('', null),
          zip: Joi.string()
            .max(45)
            .allow('', null),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/account-details/current-preferences',
    handler: asyncHandler(saveUserPreferencesForLoggedInUser),
    config: {
      description:
        'Save Time Zone and Culture of the person Object Linked for the Logged In User',
      notes:
        'Returns a person object, prevents a user from trying to edit a person object not linked to their own profile',
      validate: {
        payload: {
          id: Joi.number()
            .integer()
            .required(),
          timezone: Joi.string()
            .max(255)
            .required(),
          culture: Joi.string()
            .max(45)
            .required(),
        },
      },
    },
  },
]

module.exports = { routes }
