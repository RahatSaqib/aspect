const Joi = require('@hapi/joi')
const {
  downloadApplicationConfigResponseValidation,
  downloadSystemConfigResponseValidation,
  retrieveAppIdConfigResponseValidation,
} = require('./common/validations')
const {
  fetchApplicationConfigServiceHandler,
  fetchSystemConfigServiceHandler,
  fetchAppIdFromUniqueDeviceCodeHandler,
} = require('./common/service')
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
  {
    method: 'GET',
    path: '/v4/config/retrieve-app-id',
    handler: asyncHandler(fetchAppIdFromUniqueDeviceCodeHandler),
    config: {
      auth: { scope: ['result:view'] },
      validate: {
        query: {
          deviceCode: Joi.string().required().description('Unique hardware device code from the mobile device'),
        },
      },
      description: 'Endpoint for retrieving app-id based on unique device code sent by the mobile app',
      notes:
        'Assigns the first available 3-digit app ID based on priority: unassigned records, oldest inactive records, or oldest active records older than 3 months. Returns 409 conflict if all mobile spots are assigned.',
      response: {
        options: { allowUnknown: false },
        schema: retrieveAppIdConfigResponseValidation(),
      },
    },
  },
]

module.exports = { routes }
