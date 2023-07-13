const {
  downloadApplicationConfigResponseValidation,
  downloadSystemConfigResponseValidation,
} = require('./common/validations')
const { fetchApplicationConfigServiceHandler, fetchSystemConfigServiceHandler } = require('./common/service')
const { asyncHandler } = require('../../routes')

// -----------------------------------------------------
// routes
// -----------------------------------------------------
const routes = [
  {
    method: 'GET',
    path: '/v4/config/application',
    handler: asyncHandler(fetchApplicationConfigServiceHandler),
    config: {
      description:
        'Endpoint for retrieving basic application configuration for Mobile App instances querying this server',
      notes: 'Used for syncing Aspect Mobile configuration options',
      auth: { scope: ['result:view'] },
      response: {
        options: { allowUnknown: false },
        schema: downloadApplicationConfigResponseValidation(),
      },
    },
  },
  {
    method: 'GET',
    path: '/v4/config/system',
    handler: asyncHandler(fetchSystemConfigServiceHandler),
    config: {
      description: 'Endpoint for retrieving basic system configuration for Mobile App instances querying this server',
      notes: 'Used for syncing fetch intervals for slow changing data in Aspect Mobile',
      auth: { scope: ['result:view'] },
      response: {
        options: { allowUnknown: false },
        schema: downloadSystemConfigResponseValidation(),
      },
    },
  },
]

module.exports = { routes }
