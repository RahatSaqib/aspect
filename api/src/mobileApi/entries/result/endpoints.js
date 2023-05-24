const { downloadEntriesResponseValidation } = require('./common/validations/validations')
const { downloadEntriesRequestValidation } = require('./common/validations/downloadEntriesRequestValidation')
const { fetchEntriesServiceHandler } = require('./common/service')
const { asyncHandler } = require('../../../routes')

// -----------------------------------------------------
// routes
// -----------------------------------------------------
const routes = [
  {
    method: 'GET',
    path: '/v4/entries',
    handler: asyncHandler(fetchEntriesServiceHandler),
    config: {
      description: 'Endpoint for retrieving samples and results',
      notes: 'Used for syncing the Aspect mobile the endpoint allows users to fetch the latest samples and results',
      auth: { scope: ['result:view'] },
      validate: downloadEntriesRequestValidation(),
      response: {
        options: { allowUnknown: false },
        schema: downloadEntriesResponseValidation(),
      },
    },
  },
]

module.exports = { routes }
