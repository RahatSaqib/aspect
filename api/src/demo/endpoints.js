const Joi = require('joi')
const {
  asyncHandler
} = require('../routes')
const {
  getDemoDevice
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
  }
]
