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
  getLicense,
  acceptLicense,
  // --------------------
  // API for permissions
  // --------------------
  assignJob,
  unassignJob,
  assignJobContext,
  unassignJobContext,
  assignJobFunctionDashboardWidgets,
  unassignJobFunctionDashboardWidgets,
  assignJobFunctionFeatures,
  unassignJobFunctionFeatures,
  assignJobFunctionPermissions,
  unassignJobFunctionPermissions,
} = require('./service')

// ---------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------
const ok = Joi.boolean()
  .required()
  .description(
    `
    True means workflow ran well, False - some non-breakable error happened.
    If both cases - see more details in other props (i.e. "data").
    FYI - breakable error is when return Boom.
    `
  )
const jobConfig = {
  auth: { scope: ['person:admin'] },
  validate: {
    payload: {
      personId: Joi.number().required(),
      jobFunctionId: Joi.number().required(),
    },
  },
  response: {
    options: {
      allowUnknown: false,
    },
    schema: Joi.object().keys({
      ok,
      data: Joi.array()
        .required()
        .description('All jobs for specified person')
        .items(
          Joi.object().keys({
            id: Joi.number()
              .required()
              .description('Job.id'),
            personId: Joi.number()
              .required()
              .description('Job.personId'),
            jobFunctionId: Joi.number()
              .required()
              .description('Job.jobFunctionId'),
          })
        ),
    }),
  },
}
const jobContextConfig = {
  auth: { scope: ['person:admin'] },
  validate: {
    payload: {
      personId: Joi.number().required(),
      jobFunctionId: Joi.number().required(),
      geographyId: Joi.number().allow(null),
      siteId: Joi.number().allow(null),
      removeJob: Joi.boolean().allow(null),
    },
  },
  response: {
    options: {
      allowUnknown: false,
    },
    schema: Joi.object().keys({
      ok,
      data: Joi.array()
        .required()
        .description('All job contexts for specified person')
        .items(
          Joi.object().keys({
            jobId: Joi.number()
              .required()
              .description('JobContext.jobId'),
            personId: Joi.number()
              .required()
              .description('Job.personId'),
            jobFunctionId: Joi.number()
              .required()
              .description('Job.jobFunctionId'),
            geographyId: Joi.number().description('JobContext.geographyId'),
            siteId: Joi.number().description('JobContext.siteId'),
          })
        ),
    }),
  },
}
const jobFunctionDashboardWidgetResponse = {
  options: {
    allowUnknown: false,
  },
  schema: Joi.object().keys({
    ok,
    data: Joi.array()
      .required()
      .description('All accessible widgets for specified job function')
      .items(
        Joi.object().keys({
          widgetId: Joi.number()
            .required()
            .description('widgetId'),
          jobFunctionId: Joi.number()
            .required()
            .description('jobFunctionId'),
        })
      ),
  }),
}
const jobFunctionFeatureResponse = {
  options: {
    allowUnknown: false,
  },
  schema: Joi.object().keys({
    ok,
    data: Joi.array()
      .required()
      .description('All features for specified job function')
      .items(
        Joi.object().keys({
          featureId: Joi.number()
            .required()
            .description('featureId'),
          jobFunctionId: Joi.number()
            .required()
            .description('jobFunctionId'),
        })
      ),
  }),
}
const jobFunctionPermissionsResponse = {
  options: {
    allowUnknown: false,
  },
  schema: Joi.object().keys({
    ok,
    data: Joi.array()
      .required()
      .description('All permissions for specified job function')
      .items(
        Joi.object().keys({
          permissionId: Joi.number()
            .required()
            .description('permissionId'),
          jobFunctionId: Joi.number()
            .required()
            .description('jobFunctionId'),
        })
      ),
  }),
}

// ---------------------------------------------------------------------------------------------
// routes
// ---------------------------------------------------------------------------------------------
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
          clientType: Joi.string(),
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
          culture: Joi.string().required(),
          timezone: Joi.string().required(),
          displayPreferences: Joi.object(),
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
          userLockedOut: Joi.boolean().allow(null),
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
  {
    method: 'GET',
    path: '/auth/license',
    handler: asyncHandler(getLicense),
    config: {
      description: 'Load license for the user',
      notes: 'Loads the the license that applies to the current user',
      validate: {
        query: {
          licenseId: Joi.number()
            .description('License ID')
            .required()
            .description('ID of the license'),
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
      notes:
        'Looks up the license based on the give license ID and marks it as accepted for the current user',
      validate: {
        payload: {
          licenseId: Joi.number().required(),
          clientId: Joi.string().required(),
          token: Joi.string().required(),
        },
      },
    },
  },
  // ------------
  // Job
  // ------------
  {
    method: 'POST',
    path: '/auth/assign-job',
    handler: asyncHandler(assignJob),
    config: {
      description: 'Assign person to job function',
      notes: 'Assign person to job function',
      ...jobConfig,
    },
  },
  {
    method: 'PUT',
    path: '/auth/unassign-job',
    handler: asyncHandler(unassignJob),
    config: {
      description: 'Un-assign person from job function',
      notes: 'Un-assign person from job function',
      ...jobConfig,
    },
  },
  // ------------
  // Job Context
  // ------------
  {
    method: 'POST',
    path: '/auth/assign-job-context',
    handler: asyncHandler(assignJobContext),
    config: {
      description: 'Assign specified person to Job Context',
      notes: 'Assign specified person to Job Context',
      ...jobContextConfig,
    },
  },
  {
    method: 'PUT',
    path: '/auth/unassign-job-context',
    handler: asyncHandler(unassignJobContext),
    config: {
      description: 'Un-assign specified person from Job Context',
      notes: 'Un-assign specified person from Job Context',
      ...jobContextConfig,
    },
  },
  // ------------
  // Job Function Dashboard Widget
  // ------------
  {
    method: 'POST',
    path: '/auth/assign-job-function-dashboard-widget',
    handler: asyncHandler(assignJobFunctionDashboardWidgets),
    config: {
      description: 'Assign user to access dashboard widget',
      notes: 'Assign user to access dashboard widget',
      auth: { scope: ['person:admin'] },
      validate: {
        payload: {
          jobFunctionId: Joi.number().required(),
          widgets: Joi.array()
            .items(Joi.number())
            .required(),
        },
      },
      response: jobFunctionDashboardWidgetResponse,
    },
  },
  {
    method: 'PUT',
    path: '/auth/unassign-job-function-dashboard-widget',
    handler: asyncHandler(unassignJobFunctionDashboardWidgets),
    config: {
      description: 'Un-assign user from dashboard widget',
      notes: 'Un-assign user from dashboard widget',
      auth: { scope: ['person:admin'] },
      validate: {
        payload: {
          jobFunctionId: Joi.number().required(),
          widgets: Joi.array()
            .items(Joi.number())
            .allow(null),
          all: Joi.boolean().allow(null),
        },
      },
      response: jobFunctionDashboardWidgetResponse,
    },
  },
  // ------------
  // Job Function Feature
  // ------------
  {
    method: 'POST',
    path: '/auth/assign-job-function-features',
    handler: asyncHandler(assignJobFunctionFeatures),
    config: {
      description: 'Assign features to specified JobFunction',
      notes: 'Assign features to specified JobFunction',
      auth: { scope: ['person:admin'] },
      validate: {
        payload: {
          jobFunctionId: Joi.number().required(),
          features: Joi.array()
            .items(Joi.number())
            .required(),
        },
      },
      response: jobFunctionFeatureResponse,
    },
  },
  {
    method: 'PUT',
    path: '/auth/unassign-job-function-features',
    handler: asyncHandler(unassignJobFunctionFeatures),
    config: {
      description: 'Unassign features from specified JobFunction',
      notes: 'Unassign features from specified JobFunction',
      auth: { scope: ['person:admin'] },
      validate: {
        payload: {
          jobFunctionId: Joi.number().required(),
          features: Joi.array()
            .items(Joi.number())
            .allow(null),
          all: Joi.boolean().allow(null),
        },
      },
      response: jobFunctionFeatureResponse,
    },
  },
  // ------------
  // Job Function Permissions
  // ------------
  {
    method: 'POST',
    path: '/auth/assign-job-function-permissions',
    handler: asyncHandler(assignJobFunctionPermissions),
    config: {
      description: 'Assign permissions to specified JobFunction',
      notes: 'Assign permissions to specified JobFunction',
      auth: { scope: ['person:admin'] },
      validate: {
        payload: {
          jobFunctionId: Joi.number().required(),
          permissions: Joi.array()
            .items(Joi.number())
            .required(),
        },
      },
      response: jobFunctionPermissionsResponse,
    },
  },
  {
    method: 'PUT',
    path: '/auth/unassign-job-function-permissions',
    handler: asyncHandler(unassignJobFunctionPermissions),
    config: {
      description: 'Unassign permissions for specified JobFunction',
      notes: 'Unassign permissions for specified JobFunction',
      auth: { scope: ['person:admin'] },
      validate: {
        payload: {
          jobFunctionId: Joi.number().required(),
          permissions: Joi.array()
            .items(Joi.number())
            .allow(null),
          all: Joi.boolean().allow(null),
        },
      },
      response: jobFunctionPermissionsResponse,
    },
  },
]

module.exports = { routes }
