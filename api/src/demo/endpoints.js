const Joi = require('joi')
const { asyncHandler } = require('../routes')
const {
  getDemoDevice,
  createDemoDeviceApiKey,
  postDemoDeviceResult,
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
          deviceId: Joi.string()
            .description('Device id')
            .required(),
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/demo/device/api-key',
    handler: asyncHandler(createDemoDeviceApiKey),
    config: {
      description: 'Create New API Key',
      notes: 'Create new API Key',
    },
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
          deviceId: Joi.string()
            .description('Device id')
            .required(),
        },
        payload: {
          resultId: Joi.number()
            .integer()
            .description('Result Id')
            .required(),
        },
      },
    },
  },
]
