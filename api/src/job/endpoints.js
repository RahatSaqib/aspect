const Joi = require('@hapi/joi')
const { asyncHandler } = require('../routes')
const {
  getJobFunctionsForSelectList,
  getPermissions,
  assignJobContext,
  unassignJobContext,
  assignJobFunctionDashboardWidgets,
  unassignJobFunctionDashboardWidgets,
  assignJobFunctionPermissions,
  unassignJobFunctionPermissions,
  assignPersonTo,
  getPersonAssignments,
  removePersonAssignment,
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

const jobContextResponse = {
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
          personId: Joi.number().required().description('Job.personId'),
          jobFunctionId: Joi.number().required().description('Job.jobFunctionId'),
          geographyId: Joi.number().allow(null).description('JobContext.geographyId'),
          siteId: Joi.number().allow(null).description('JobContext.siteId'),
          deviceTypeId: Joi.number().allow(null).description('JobContext.deviceTypeId'),
          assayTypeId: Joi.number().allow(null).description('JobContext.assayTypeId'),
          assayId: Joi.number().allow(null).description('JobContext.assayId'),
        })
      ),
  }),
}
const personAssignmentsResponse = {
  options: {
    allowUnknown: false,
  },
  schema: Joi.object().keys({
    ok,
    data: Joi.array()
      .required()
      .description('All job assignments for specified person')
      .items(
        Joi.object().keys({
          // ----------
          // required
          // ----------
          personId: Joi.number().required().description('Job.personId'),
          partnerId: Joi.number().required().description('JobFunction.personId'),
          jobContextId: Joi.number().required().description('JobContext.id'),
          jobFunctionId: Joi.number().required().description('Job.jobFunctionId'),
          jobFunctionName: Joi.string().required().description('JobFunction.name'),
          countryId: Joi.number().required().description('Country.id'),
          countryName: Joi.string().required().description('Country.name'),
          // ----------
          // optional
          // ----------
          siteId: Joi.number().allow(null).description('JobContext.siteId'),
          siteName: Joi.string().allow(null, '').description('Site.name'),
          geographyId: Joi.number().allow(null).description('JobContext.geographyId'),
          stateId: Joi.number().allow(null).description('State.id'),
          stateName: Joi.string().allow(null, '').description('State.name'),
          lgaId: Joi.number().allow(null).description('Lga.id'),
          lgaName: Joi.string().allow(null, '').description('Lga.name'),
          deviceTypeId: Joi.number().allow(null).description('DeviceType.id'),
          deviceTypeName: Joi.string().allow(null, '').description('DeviceType.name'),
          diseaseId: Joi.number().allow(null).description('Disease.id'),
          diseasei18nKey: Joi.string().allow(null, '').description('Disease.i18nKey'),
          diseaseName: Joi.string().allow(null, '').description('Disease.name'),
          assayTypeId: Joi.number().allow(null).description('AssayType.id'),
          assayTypei18nKey: Joi.string().allow(null, '').description('AssayType.i18nKey'),
          assayTypeName: Joi.string().allow(null, '').description('AssayType.name'),
          assayId: Joi.number().allow(null).description('Assay.id'),
          assayi18nKey: Joi.string().allow(null, '').description('Assay.i18nKey'),
          assayName: Joi.string().allow(null, '').description('Assay.name'),
          tagId: Joi.number().allow(null).description('Tag.id'),
          tagTitle: Joi.string().allow(null, '').description('Tag.title'),
        })
      ),
  }),
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
          widgetId: Joi.number().required().description('widgetId'),
          jobFunctionId: Joi.number().required().description('jobFunctionId'),
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
          permissionId: Joi.number().required().description('permissionId'),
          jobFunctionId: Joi.number().required().description('jobFunctionId'),
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
      auth: { scope: ['person', 'deviceApiKey'] },
    },
  },
  {
    method: 'GET',
    path: '/job-function/permissions/{personId}/{partnerId}',
    handler: asyncHandler(getPermissions),
    config: {
      description: 'Get list of permissions for person and partner',
      notes: 'Get list of permissions for person and partner',
      auth: { scope: ['person'] },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok,
          data: Joi.array()
            .required()
            .description('Base list of permissions for person and partner')
            .items(Joi.string().required().description('in format "module:action", like "device:edit" ')),
        }),
      },
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
      auth: { scope: ['person:edit'] },
      validate: {
        payload: {
          personId: Joi.number(),
          jobFunctionId: Joi.number(),
          geographyId: Joi.number(),
          siteId: Joi.number(),
          deviceTypeId: Joi.number(),
          assayTypeId: Joi.number(),
          assayId: Joi.number(),
          removeJob: Joi.boolean(),
        },
      },
      response: jobContextResponse,
    },
  },
  {
    method: 'POST',
    path: '/job-function/unassign-job-context',
    handler: asyncHandler(unassignJobContext),
    config: {
      description: 'Un-assign specified person from Job Context',
      notes: 'Un-assign specified person from Job Context',
      auth: { scope: ['person:edit'] },
      validate: {
        payload: {
          personId: Joi.number(),
          jobFunctionId: Joi.number(),
          geographyId: Joi.number(),
          siteId: Joi.number(),
          deviceTypeId: Joi.number(),
          assayTypeId: Joi.number(),
          assayId: Joi.number(),
          removeJob: Joi.boolean(),
        },
      },
      response: jobContextResponse,
    },
  },
  // ------------
  // Job Function Dashboard Widget
  // ------------
  {
    method: 'POST',
    path: '/job-function/assign-widgets',
    handler: asyncHandler(assignJobFunctionDashboardWidgets),
    config: {
      description: 'Assign user to access dashboard widget',
      notes: 'Assign user to access dashboard widget',
      auth: { scope: ['person:edit'] },
      validate: {
        payload: {
          jobFunctionId: Joi.number().required(),
          widgets: Joi.array().items(Joi.number()).required(),
        },
      },
      response: jobFunctionDashboardWidgetResponse,
    },
  },
  {
    method: 'POST',
    path: '/job-function/unassign-widgets',
    handler: asyncHandler(unassignJobFunctionDashboardWidgets),
    config: {
      description: 'Un-assign user from dashboard widget',
      notes: 'Un-assign user from dashboard widget',
      auth: { scope: ['person:edit'] },
      validate: {
        payload: {
          jobFunctionId: Joi.number().required(),
          widgets: Joi.array().items(Joi.number()).allow(null),
          all: Joi.boolean().allow(null),
        },
      },
      response: jobFunctionDashboardWidgetResponse,
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
      auth: { scope: ['person:edit'] },
      validate: {
        payload: {
          jobFunctionId: Joi.number().required(),
          permissions: Joi.array().items(Joi.number()).required(),
        },
      },
      response: jobFunctionPermissionsResponse,
    },
  },
  {
    method: 'POST',
    path: '/job-function/unassign-permissions',
    handler: asyncHandler(unassignJobFunctionPermissions),
    config: {
      description: 'Unassign permissions for specified JobFunction',
      notes: 'Unassign permissions for specified JobFunction',
      auth: { scope: ['person:edit'] },
      validate: {
        payload: {
          jobFunctionId: Joi.number().required(),
          permissions: Joi.array().items(Joi.number()).allow(null),
          all: Joi.boolean().allow(null),
        },
      },
      response: jobFunctionPermissionsResponse,
    },
  },
  // ------------
  // Get person assignments
  // ------------
  {
    method: 'GET',
    path: '/job-function/person-assignments/{personId}',
    handler: asyncHandler(getPersonAssignments),
    config: {
      description: 'Get all person assignments',
      notes: 'List of JobFunctions/Site/Geography/etc person is assigned to',
      auth: { scope: ['person:edit'] },
      validate: {
        params: {
          personId: Joi.string().description('Person ID').required(),
        },
      },
      response: personAssignmentsResponse,
    },
  },
  // ------------
  // Add person assignments
  // ------------
  {
    method: 'POST',
    path: '/job-function/assign-person-to-job-and-context',
    handler: asyncHandler(assignPersonTo),
    config: {
      description: 'Assign specified person to Job Context with most granular input params',
      notes: 'Assign specified person to Job Context',
      auth: { scope: ['person:edit'] },
      validate: {
        payload: {
          personId: Joi.number().required(),
          jobFunctionId: Joi.number().required(),
          // --- below props for getting either siteId (wins if defined) or geographyId (if siteId is missing) for JobContext
          // geography
          countryId: Joi.number().allow(null),
          stateId: Joi.number().allow(null),
          lgaId: Joi.number().allow(null),
          // site
          siteId: Joi.number().allow(null),
          // device/assay type
          diseaseId: Joi.number().allow(null),
          deviceTypeId: Joi.string().allow(null).description('The device type external id'),
          assayTypeId: Joi.number().allow(null),
          assayId: Joi.number().allow(null),
          tagId: Joi.number().allow(null),
        },
      },
      response: personAssignmentsResponse,
    },
  },
  // ------------
  // Remove person assignment
  // ------------
  {
    method: 'DELETE',
    path: '/job-function/person-assignment/{personId}/{jobContextId}',
    handler: asyncHandler(removePersonAssignment),
    config: {
      description: 'Remove specified person assignment',
      notes: 'Remove specified person assignment',
      auth: { scope: ['person:edit'] },
      validate: {
        params: {
          personId: Joi.number().integer().positive().required(),
          jobContextId: Joi.number().integer().positive().required(),
        },
      },
      response: personAssignmentsResponse,
    },
  },
]

module.exports = { routes }
