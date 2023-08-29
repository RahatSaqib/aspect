const Joi = require('@hapi/joi')
const { asyncHandler } = require('../routes')
const { loginHistoryWrapper } = require('./loginHistory')

const {
  authenticate,
  checkAuthentication,
  refreshToken,
  updateUsernameAndPasswordForLoggedInUser,
  updateUsernameAndPasswordForPerson,
  createResetPasswordToken,
  updatePasswordWithResetPasswordToken,
  clientTypes,
  getLicense,
  acceptLicense,
  getUserJobFunctions,
} = require('./service')

const routes = [
  {
    method: 'POST',
    path: '/auth',
    handler: loginHistoryWrapper(authenticate),
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
          clientType: Joi.string()
            .lowercase()
            .valid(...Object.values(clientTypes)),
          deviceTokenId: Joi.string().allow(null),
        },
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          access: Joi.string().required().max(2048),
          refresh: Joi.string().required(),
          clientId: Joi.string().required(),
          countryId: Joi.number(),
          countryAbbreviation: Joi.string(),
          clientType: Joi.string().required(),
          culture: Joi.string().required(),
          timezone: Joi.string().required(),
          displayPreferences: Joi.object(),
          deviceTokenId: Joi.string().allow(null),
          userId: Joi.number().integer().required(),
          personId: Joi.number().integer().required(),
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
          clientType: Joi.string()
            .lowercase()
            .valid(...Object.values(clientTypes)),
          deviceTokenId: Joi.string().allow(null),
        },
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          access: Joi.string().required(),
          refresh: Joi.string().required(),
          clientId: Joi.string().required(),
          clientType: Joi.string().required(),
          deviceTokenId: Joi.string().allow(null),
          userId: Joi.number().integer().required(),
          personId: Joi.number().integer().required(),
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
          currentPassword: Joi.string().max(100).required(),
          newUsername: Joi.string().max(255).allow('', null),
          newPassword: Joi.string().max(100).allow('', null),
          clientName: Joi.string().required(),
          clientType: Joi.string()
            .lowercase()
            .valid(...Object.values(clientTypes)),
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
      notes: 'Generate a new reset password token and send it to the user via email',
      validate: {
        params: {
          email: Joi.string().description('Email address').required(),
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
          resetPasswordToken: Joi.string().description('Reset Password Token').required(),
        },
        payload: {
          newPassword: Joi.string().max(100).required(),
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
      auth: { scope: ['person:edit'] },
      description: 'Update username and password linked to a person',
      notes: 'Returns an array of the fields that were updated',
      validate: {
        params: {
          personId: Joi.string().description('Person ID').required(),
        },
        payload: {
          canLogIn: Joi.boolean(),
          newUsername: Joi.string().max(255).allow('', null),
          newPassword: Joi.string().max(100).allow('', null),
          userLockedOut: Joi.boolean().allow(null),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/auth/job-functions',
    handler: asyncHandler(getUserJobFunctions),
    config: {
      description: 'Get the job functions of the logged in user',
      notes: 'Returns a list of job function names',
    },
  },
  {
    method: 'GET',
    path: '/auth/license',
    handler: asyncHandler(getLicense),
    config: {
      description: 'Load license for the user',
      notes: 'Loads the the license that applies to the current user',
      validate: {
        query: {
          licenseId: Joi.number().description('License ID').required().description('ID of the license'),
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/auth/license',
    handler: asyncHandler(acceptLicense),
    config: {
      description: 'Accepts the given license for the current user',
      notes: 'Looks up the license based on the give license ID and marks it as accepted for the current user',
      validate: {
        payload: {
          licenseId: Joi.number().required(),
          clientId: Joi.string().required(),
          token: Joi.string().required(),
        },
      },
    },
  },
]

module.exports = { routes }
