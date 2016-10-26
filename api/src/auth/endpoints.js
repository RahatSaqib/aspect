let Joi = require('joi')

let { asyncHandler } = require('../routes')

let {
  authenticate,
  checkAuthentication,
  getDeviceApiKey,
  refreshToken,
  updateUsernameAndPasswordForLoggedInUser
} = require('./service')

module.exports = [
  {
    method: 'POST',
    path: '/auth',
    handler: asyncHandler(authenticate),
    config: {
      auth: false,
      description: 'Authenticate user',
      notes: 'Generate new JWT token given user name and password',
      validate: {
        payload: {
          name: Joi.string().required(),
          password: Joi.string().required(),
          clientName: Joi.string().required(),
          clientId: Joi.string()
        }
      }
    }
  }, {
    method: 'GET',
    path: '/auth',
    handler: asyncHandler(checkAuthentication),
    config: {
      description: 'Check authentication',
      notes: 'Check successful authentication token'
    }
  }, {
    method: 'POST',
    path: '/auth/refresh',
    handler: asyncHandler(refreshToken),
    config: {
      auth: false,
      description: 'Refresh Token',
      notes: 'Generate a new access token by sending a refresh token',
      validate: {
        payload: {
          clientId: Joi.string().required(),
          token: Joi.string().required()
        }
      }
    }
  }, {
    method: 'PUT',
    path: '/auth/update-login-details',
    handler: asyncHandler(updateUsernameAndPasswordForLoggedInUser),
    config: {
      description: 'Update username and password for logged in user',
      notes: 'Returns an array of the fields that were updated',
      validate: {
        payload: {
          currentPassword: Joi.string().max(100).required(),
          newUsername: Joi.string().max(255).allow('', null),
          newPassword: Joi.string().max(100).allow('', null),
          clientName: Joi.string().required(),
          clientId: Joi.string()
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/auth/device/{deviceId}/apiKey',
    handler: asyncHandler(getDeviceApiKey),
    config: {
      description: 'Get Device API Key',
      notes: 'Get API Key for the specified device',
      auth: {scope: ['admin', 'device:admin']},
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required()
        }
      }
    }
  }
]
