const Joi = require('joi')

// Adds all API routes to the server
function addClientRoutes(server) {
  server.route(
    require('./accountDetails/endpoints').routes.map(decorateClientAPI())
  )
  server.route(require('./auth/endpoints').routes.map(decorateClientAPI()))
  server.route(
    require('./assay/endpoints').routes.map(decorateClientAPI('assay'))
  )
  server.route(
    require('./demo/endpoints').routes.map(decorateClientAPI('demo'))
  )
  server.route(
    require('./device/endpoints').routes.map(decorateClientAPI('device'))
  )
  server.route(
    require('./deviceApiKey/endpoints').routes.map(
      decorateClientAPI('deviceApiKey')
    )
  )
  server.route(
    require('./deviceOperation/endpoints').routes.map(
      decorateClientAPI('device')
    )
  )
  server.route(
    require('./deviceType/endpoints').routes.map(decorateClientAPI('device'))
  )
  server.route(require('./geography/endpoints').routes.map(decorateClientAPI()))
  server.route(
    require('./person/endpoints').routes.map(decorateClientAPI('person'))
  )
  server.route(
    require('./site/endpoints').routes.map(decorateClientAPI('site'))
  )
  server.route(
    require('./result/endpoints').routes.map(decorateClientAPI('result'))
  )
  server.route(
    require('./report/endpoints').routes.map(decorateClientAPI('report'))
  )
  server.route(
    require('./partner/endpoints').routes.map(decorateClientAPI('partner'))
  )
  server.route(
    require('./job/endpoints').routes.map(decorateClientAPI('person'))
  )
  server.route(
    require('./consumable/endpoints').routes.map(decorateClientAPI('inventory'))
  )
  server.route(
    require('./issue/endpoints').routes.map(decorateClientAPI('issue'))
  )
  server.route(
    require('./notification/endpoints').routes.map(
      decorateClientAPI('notification')
    )
  )
  server.route(
    require('./task/endpoints').routes.map(decorateClientAPI('task'))
  )
  server.route(
    require('./inventory/endpoints').routes.map(decorateClientAPI('inventory'))
  )
  server.route(
    require('./dashboard/endpoints').routes.map(decorateClientAPI('dashboard'))
  )
  server.route(require('./tag/endpoints').routes.map(decorateClientAPI()))
  server.route(
    require('./server/endpoints').routes.map(decorateClientAPI('server'))
  )
}

function addDeviceRoutes(server) {
  server.route(
    require('./deviceApi/endpoints').routes.map(decorateDeviceAPI('device'))
  )
}

function addDeviceRawRoutes(server) {
  server.route(
    require('./deviceApiRaw/endpoints').routes.map(
      decorateDeviceAPI('device/raw')
    )
  )
}

// Decorates an API route with common configuration so
// it does not need to specified explicity for every route
function decorateClientAPI(module) {
  // must always be authenticated using Client JWT
  const scope = ['+clientApi']
  const strategies = ['clientApi']

  if (module) {
    // If module specified, must have one of admin or `{module}:admin`
    // in addition to any other listed in scope of routes.
    scope.push('admin', `${module}:admin`)
  }
  return decorateAPI({ scope, strategies })
}

function decorateDeviceAPI() {
  // must always be authenticated using Device JWT
  const scope = ['+deviceApi']
  const strategies = ['deviceApiBasic', 'deviceApiKey']
  return decorateAPI({ scope, strategies })
}

function decorateAPI({ scope, strategies }) {
  return route => {
    // add ['api'] tag by default so available in Hapi-Swagger
    let { config } = route
    if (!config) {
      config = {}
      route.config = config
    }
    if (!config.tags) {
      config.tags = ['api']
    }

    // If route is authenticated, add common configuration
    if (config.auth !== false) {
      // Require module scope to all routes
      if (module) {
        let { auth } = config
        if (!auth) {
          // could be undefined instead of explicitly false
          auth = {}
          config.auth = auth
        }
        auth.strategies = strategies.concat(auth.strategies || [])
        auth.scope = scope.concat(auth.scope || [])
      }

      // Add JWT Auth token query param configuration
      let { validate } = config
      if (!validate) {
        validate = {}
        config.validate = validate
      }
      let { query } = validate
      if (!query) {
        query = {}
        validate.query = query
      }
      const { token } = query
      if (!token) {
        query.token = Joi.string().description('JWT Authentication token')
      }
    }

    return route
  }
}

function asyncHandler(handler) {
  return (request, reply) =>
    handler(request)
      .then(reply)
      .then(null, err => {
        // Log err stack and Rethrow to Hapi handles error case and Boom.500
        console.error(err) // eslint-disable-line no-console
        throw err
      })
}

// extracts and sanitizes the parameters related to sorting and paging
// from the candidate params and returns them as an object
function getSortPageParams(params, sortColumnMapping, defaultSort) {
  return Object.assign(
    {},
    getSortParams(params, sortColumnMapping, defaultSort),
    getPageParams(params)
  )
}

// extracts and sanitizes the parameters related to sorting from the
// candidate params and returns them as an object
function getSortParams(params, sortColumnMapping, defaultSort) {
  const result = {}

  result.sortCol =
    sortColumnMapping && params.sortCol && sortColumnMapping[params.sortCol]
      ? sortColumnMapping[params.sortCol]
      : params.sortCol
      ? params.sortCol
      : defaultSort
  result.sortDir = params.sortDir === 'desc' ? 'desc' : 'asc'

  return result
}

// extracts and sanitizes the parameters related to paging from the
// candidate params and returns them as an object
function getPageParams(params) {
  const result = {}

  result.page = parseInt(params.page, 10) || 0
  result.size = parseInt(params.size, 10) || 50
  result.skip = result.page * result.size

  return result
}

function validateSortPageParams(...sortColumns) {
  return {
    sortCol:
      sortColumns.length > 0
        ? Joi.string()
            .valid(sortColumns)
            .description('Sort on named column')
        : Joi.string().description('Sort on named column'),
    sortDir: Joi.string()
      .valid('asc', 'desc')
      .description('Sort order ascending or descending'),
    page: Joi.number()
      .integer()
      .min(0)
      .description('Page index with 0 as first page'),
    size: Joi.number()
      .integer()
      .positive()
      .description('Page size'),
  }
}

function validateDateRangeParams() {
  return {
    minDate: Joi.date()
      .iso()
      .allow(null)
      .description('From Date'),
    maxDate: Joi.date()
      .iso()
      .allow(null)
      .description('To Date'),
  }
}
function validateResultResponse() {
  return {
    id: Joi.number()
      .required()
      .description('Unique ID of the result for this instance of Aspect'),
    deviceName: Joi.string()
      .allow('')
      .description('Filter for device name'),
    externalId: Joi.string()
      .allow(null)
      .description('Unique ID of the result for this diagnostic device'),
    startedOn: Joi.date()
      .allow(null)
      .description(
        'When sample processing started. Note that the zone designator is empty because this is the local date/time as reported by the device. This should be shown as is and not converted to the user time zone.'
      ),
    endedOn: Joi.date()
      .allow(null)
      .description(
        'When sample processing ended. Note that the zone designator is empty because this is the local date/time as reported by the device. This should be shown as is and not converted to the user time zone.'
      ),
    createdOn: Joi.date()
      .required()
      .description(
        'When the result was added to the Aspect database. This can be converted to the user time zone.'
      ),
    updatedOn: Joi.date()
      .required()
      .description(
        'When the result was last updated in the Aspect database. This can be converted to the user time zone.'
      ),
    deviceId: Joi.number()
      .integer()
      .positive()
      .required()
      .description('Device id in aspect'),
    deviceSerial: Joi.string()
      .allow(null, '')
      .description('The device serial number'),
    countryName: Joi.string().description("The device's country name"),
    stateName: Joi.string()
      .allow(null)
      .description("The device's state name"),
    lgaName: Joi.string()
      .allow(null)
      .description("The device's lga name"),
    resultWorkflowChangedOn: Joi.date()
      .allow(null)
      .description('The date when status was changed'),
    resultCategory1Name: Joi.string()
      .allow(null)
      .description("The result's category 1 name"),
    resultCategory2Name: Joi.string()
      .allow(null)
      .description("The result's category 2 name"),
    resultWorkflowStatusId: Joi.number()
      .integer()
      .description("The result's workflow status id"),
    resultWorkflowStatus: Joi.string()
      .allow(null)
      .description("The result's Workflow status name"),
    resultWorkflowStatusExternalId: Joi.string()
      .allow(null)
      .description("The result's Workflow status name"),
    resultData: Joi.object().description('The result data'),
    files: Joi.array().description('Result Files'),
    formData: Joi.object()
      .allow(null)
      .description('The form data'),
    siteId: Joi.number()
      .integer()
      .positive()
      .description('The id of the site'),
    resultTreatmentStatusCreatedBy: Joi.string()
      .allow(null)
      .description('The name of the user that created the note'),
    siteName: Joi.string()
      .allow(null)
      .description('The name of the site'),
    assayVersion: Joi.string()
      .allow(null)
      .description('The assay Version'),
    consumableSerial: Joi.string()
      .allow(null)
      .description('The consumable serial'),
    instrumentalSerial: Joi.string()
      .allow(null)
      .description('The instrumental serial'),
    consumableLot: Joi.string()
      .allow(null)
      .description('The consumable lot'),
    instrumentSerial: Joi.string()
      .allow(null)
      .description('Instrumental serial number'),
    moduleName: Joi.string()
      .allow(null)
      .description('The module name'),
    moduleSerial: Joi.string()
      .allow(null)
      .description('The module serial'),
    researchId: Joi.string()
      .allow(null)
      .description('The research id'),
    senderVersion: Joi.string()
      .allow(null)
      .description('The sender version'),
    senderOperator: Joi.string()
      .allow(null)
      .description('The sender operator'),
    consumableExpirationDate: Joi.date()
      .allow(null)
      .description('The consumable expiration date'),
    notes: Joi.string()
      .allow(null)
      .description('Any notes entered for the sample'),
    errorCode: Joi.string()
      .allow(null)
      .description(
        'If an error occurred, contains the error code from the device'
      ),
    errorNotes: Joi.string()
      .allow(null)
      .description('Contains any details about the error'),
    assayId: Joi.number()
      .integer()
      .description('The id of the assay'),
    sampleOriginSiteId: Joi.number()
      .integer()
      .description('the id of the original site'),
    sampleId: Joi.string()
      .allow(null)
      .description('Sample id'),
    sampleGroup: Joi.string()
      .allow(null)
      .description('Sample group'),
    sampleCollectedOn: Joi.date()
      .allow(null)
      .description('The date when the sample has been collected'),
    sampleOriginSiteName: Joi.string()
      .allow(null)
      .description('Sample original site name'),
    sampleTypeName: Joi.string()
      .allow(null)
      .description('Sample type name'),
    patientId: Joi.string()
      .allow(null)
      .description('The patient Id'),
    patientData: Joi.object()
      .allow(null)
      .description('The patient data'),
    formSchema: Joi.object()
      .allow(null)
      .description('The form data object'),
    assay: Joi.object()
      .allow(null)
      .description('The assay object'),
    treatmentStatus: Joi.object()
      .allow(null)
      .description('The treatment status object'),
    resultWorkflowLogReason: Joi.string()
      .allow(null)
      .description('Value of Reason from latest ResultWorkflowLog'),
    resultWorkflowLogOperator: Joi.string()
      .allow(null)
      .description('Operator from the latest ResultWorkflowLog'),
    resultWorkflowLogCreatedOn: Joi.date()
      .allow(null)
      .description('CreatedOn date from the latest ResultWorkflowLog'),
    resultTreatmentStatusChangedOn: Joi.date()
      .allow(null)
      .description('ChangedOn date from the latest ResultTreatmentStatusLog'),
    resultTreatmentStatusCreatedOn: Joi.date()
      .allow(null)
      .description('CreatedOn date from the latest ResultTreatmentStatusLog'),
    resultWorkflowLogChangedOn: Joi.date()
      .allow(null)
      .description('ChangedOn date from the latest ResultWorkflowLog'),
    resultTreatmentStatusId: Joi.number()
      .allow(null)
      .description('ID of the result treatment status'),
    resultTreatmentMethod: Joi.string()
      .allow(null, '')
      .description('Method from latest ResultTreatmentWorkflowLog'),
    resultTreatmentStatus: Joi.string()
      .allow(null, '')
      .description('ExternalId of the result treatment status'),
    treatmentStatusInfo: Joi.string()
      .allow(null, '')
      .description('treatment status info'),
    resultTreatmentData: Joi.string()
      .allow(null, '')
      .description('Operator from latest ResultTreatmentWorkflowLog'),
    resultNotes: Joi.array().description('List of result notes'),
    requiresTreatment: Joi.number()
      .allow(null, '')
      .description('Predicted required treatment'),
    followUps: Joi.array()
      .description('Result Follow Ups')
      .items(
        Joi.object().keys({
          id: Joi.number()
            .required()
            .description('Result follow up ID'),
          externalId: Joi.string()
            .allow(null, '')
            .description('External ID of the follow up'),
          date: Joi.date()
            .allow(null)
            .description('When the follow up started'),
          createdOn: Joi.date()
            .required()
            .description('When the follow up was first created in Aspect'),
          updatedOn: Joi.date()
            .required()
            .description('When the follow up was last updated in Aspect'),
          followUpExternalId: Joi.string()
            .required()
            .description('External ID of the follow up'),
          followUpName: Joi.string()
            .required()
            .description('Name of the follow up'),
          followUpi18nKey: Joi.string()
            .required()
            .description('Translation key for the follow up'),
          followUpTypeName: Joi.string()
            .required()
            .description('Name of the follow up type'),
          followUpTypeExternalId: Joi.string()
            .required()
            .description('External ID of the follow up type'),
          followUpTypei18nKey: Joi.string()
            .required()
            .description('Translation key for the follow up type'),
        })
      ),
  }
}

module.exports = {
  addClientRoutes,
  addDeviceRoutes,
  addDeviceRawRoutes,
  asyncHandler,
  getSortParams,
  getPageParams,
  getSortPageParams,
  validateSortPageParams,
  validateDateRangeParams,
  validateResultResponse,
}
