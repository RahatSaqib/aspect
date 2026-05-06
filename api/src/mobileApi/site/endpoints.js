const {
  downloadSitesAssignedSimpleResponseValidationV4,
  downloadSitesResponseValidationV4,
  downloadSitesRequestValidationV4,
} = require('./listSites/validations')
const { listSites } = require('./listSites')
const { listSitesAssigned } = require('./listSites/listSitesAssigned')
const { asyncHandler } = require('../../routes')

// -----------------------------------------------------
// routes — register /v4/sites/assigned before /v4/sites (more specific path first)
// -----------------------------------------------------
const routes = [
  {
    method: 'GET',
    path: '/v4/sites/assigned',
    handler: asyncHandler(listSitesAssigned),
    config: {
      description: 'Assigned healthcare facilities (simple list)',
      notes:
        'Same query parameters as GET /v4/sites. Returns only sites the user has a job assignment to. Used by True Connect.',
      auth: { scope: ['site'] },
      validate: downloadSitesRequestValidationV4(),
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadSitesAssignedSimpleResponseValidationV4(),
      },
    },
  },
  {
    // Aspect Mobile — sample registration; includes state-wide transfer-only rows and full flags
    method: 'GET',
    path: '/v4/sites',
    handler: asyncHandler(listSites),
    config: {
      description: 'State Healthcare Facilities',
      notes: 'List of sites in the same state as the currently logged in user',
      auth: { scope: ['site'] },
      validate: downloadSitesRequestValidationV4(),
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadSitesResponseValidationV4(),
      },
    },
  },
]

module.exports = { routes }
