const { downloadSitesResponseValidationV4 } = require('./common/validations')
const { listSites } = require('./common/service')
const { asyncHandler } = require('../../routes')

// -----------------------------------------------------
// routes
// -----------------------------------------------------
const routes = [
  {
    method: 'GET',
    path: '/v4/site',
    handler: asyncHandler(listSites),
    config: {
      description: 'Site List',
      notes: 'List of sites in the same state as the currently logged in user',
      auth: { scope: ['site'] },
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
