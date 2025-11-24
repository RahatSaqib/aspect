const { downloadSitesResponseValidationV4, downloadSitesRequestValidationV4 } = require('./listSites/validations')
const { listSites } = require('./listSites')
const { asyncHandler } = require('../../routes')

// -----------------------------------------------------
// routes
// -----------------------------------------------------
const routes = [
  {
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
