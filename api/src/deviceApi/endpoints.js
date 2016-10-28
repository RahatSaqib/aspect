let Joi = require('joi')
let { asyncHandler } = require('../routes')
let { addDeviceOperation, addDeviceConfiguration} = require('./service')

module.exports = [
  {
    method: 'POST',
    path: '/configuration',
    handler: asyncHandler(addDeviceConfiguration),
    config: {
      notes: 'Add Device Configuration',
      description: 'Add new device configuration data for the specified device',
      validate: {
        payload: {
          data: Joi.object().required()
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/operation',
    handler: asyncHandler(addDeviceOperation),
    config: {
      description: 'Device Operation',
      notes: 'Adds new device operational data for the specified device',
      validate: {
        payload: {
          data: Joi.object().required()
        }
      }
    }
  }
]
