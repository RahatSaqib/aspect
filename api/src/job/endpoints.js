const Joi = require('joi')
const { asyncHandler } = require('../routes')
const {
  getJobFunctionsForSelectList,
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
    method: 'GET',
    path: '/job-function/select-list',
    handler: asyncHandler(getJobFunctionsForSelectList),
    config: {
      description: 'Job Functions for Select List',
      notes: 'Tree structure of Partners and Job Functons',
      auth: { scope: ['person'] },
    },
  },
  // ------------
  // Job
  // ------------
  {
    method: 'POST',
    path: '/job-function/assign-job',
    handler: asyncHandler(assignJob),
    config: {
      description: 'Assign person to job function',
      notes: 'Assign person to job function',
      ...jobConfig,
    },
  },
  {
    method: 'PUT',
    path: '/job-function/unassign-job',
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
    path: '/job-function/assign-job-context',
    handler: asyncHandler(assignJobContext),
    config: {
      description: 'Assign specified person to Job Context',
      notes: 'Assign specified person to Job Context',
      ...jobContextConfig,
    },
  },
  {
    method: 'PUT',
    path: '/job-function/unassign-job-context',
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
    path: '/job-function/assign-dashboard-widget',
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
    path: '/job-function/unassign-dashboard-widget',
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
    path: '/job-function/assign-features',
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
    path: '/job-function/unassign-features',
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
    path: '/job-function/assign-permissions',
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
    path: '/job-function/unassign-permissions',
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
