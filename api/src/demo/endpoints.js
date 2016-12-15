const Joi = require('joi')
const {
  asyncHandler
} = require('../routes')
const {
  getDemoDevice,
  postDemoDeviceResult
} = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/demo/device/{deviceId}',
    handler: asyncHandler(getDemoDevice),
    config: {
      description: 'Device Demo Detail',
      notes: 'Detail of a device for the dmeo page',
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required()
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/demo/device/{deviceId}/result',
    handler: asyncHandler(postDemoDeviceResult),
    config: {
      description: 'Device Demo Detail',
      notes: 'Detail of a device for the dmeo page',
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
