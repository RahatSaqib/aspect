const Joi = require('joi')

const { asyncHandler } = require('../routes')

const {
  authenticate,
  checkAuthentication,
  refreshToken,
  updateUsernameAndPasswordForLoggedInUser,
  updateUsernameAndPasswordForPerson,
  createResetPasswordToken,
  updatePasswordWithResetPasswordToken,
  getUserFeatures,
} = require('./service')

const routes = [
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
          clientId: Joi.string(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/auth',
    handler: asyncHandler(checkAuthentication),
    config: {
      description: 'Check authentication',
      notes: 'Check successful authentication token',
    },
  },
  {
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
          token: Joi.string().required(),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/auth/update-login-details',
    handler: asyncHandler(updateUsernameAndPasswordForLoggedInUser),
    config: {
      description: 'Update username and password for logged in user',
      notes: 'Returns an array of the fields that were updated',
      validate: {
        payload: {
          currentPassword: Joi.string()
            .max(100)
            .required(),
          newUsername: Joi.string()
            .max(255)
            .allow('', null),
          newPassword: Joi.string()
            .max(100)
            .allow('', null),
          clientName: Joi.string().required(),
          clientId: Joi.string(),
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/auth/send-reset-password-token/{email}',
    handler: asyncHandler(createResetPasswordToken),
    config: {
      auth: false,
      description: 'Send Reset Password Token',
      notes:
        'Generate a new reset password token and send it to the user via email',
      validate: {
        params: {
          email: Joi.string()
            .description('Email address')
            .required(),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/auth/update-password/{resetPasswordToken}',
    handler: asyncHandler(updatePasswordWithResetPasswordToken),
    config: {
      auth: false,
      description: 'Update password for user with reset password token',
      notes: 'Returns the username so that the usr knows how to login',
      validate: {
        params: {
          resetPasswordToken: Joi.string()
            .description('Reset Password Token')
            .required(),
        },
        payload: {
          newPassword: Joi.string()
            .max(100)
            .required(),
          clientName: Joi.string().required(),
          clientId: Joi.string(),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/auth/update-person-login-details/{personId}',
    handler: asyncHandler(updateUsernameAndPasswordForPerson),
    config: {
      description: 'Update username and password linked to a person',
      notes: 'Returns an array of the fields that were updated',
      validate: {
        params: {
          personId: Joi.string()
            .description('Person ID')
            .required(),
        },
        payload: {
          newUsername: Joi.string()
            .max(255)
            .allow('', null),
          newPassword: Joi.string()
            .max(100)
            .allow('', null),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/auth/features',
    handler: asyncHandler(getUserFeatures),
    config: {
      description: 'Get UI features of the logged in user',
      notes: 'Returns a list of feature object',
    },
  },
]

module.exports = { routes }
