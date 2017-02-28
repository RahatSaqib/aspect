const Joi = require('joi')
const {
  asyncHandler,
  validateSortPageParams
} = require('../routes')
const {
  getDemoDevice,
  getDemoDeviceApiKey,
  postDemoDeviceResult
} = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/demo/device/{deviceId}',
    handler: asyncHandler(getDemoDevice),
    config: {
      description: 'Device Demo Detail',
      notes: 'Detail of a device for the demo page',
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required()
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/demo/device/api-key',
    handler: asyncHandler(getDemoDeviceApiKey),
    config: {
      description: 'Search for API Key',
      notes: 'Lookup API Keys by query filters',
      validate: {
        query: Object.assign({
          siteExternalId: Joi.string().allow('').description('Filter for facility code'),
        },
        validateSortPageParams('name', 'status', 'createdOn', 'lastSeen', 'totalTests'))
      }
    }
  },
  {
    method: 'POST',
    path: '/demo/device/{deviceId}/result',
    handler: asyncHandler(postDemoDeviceResult),
    config: {
      description: 'Device Demo Detail',
      notes: 'Posts a new result from template from the device demo page',
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required()
        },
        payload: {
          resultId: Joi.number().integer().description('Result Id').required()
        }
      }
    }
  }
]
