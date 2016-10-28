let Joi = require('joi')
let { asyncHandler } = require('../routes')
let { addDeviceOperation, addDeviceConfiguration, addResult} = require('./service')

module.exports = [
  {
    method: 'POST',
    path: '/configuration',
    handler: asyncHandler(addDeviceConfiguration),
    config: {
      notes: 'Add Device Configuration',
      description: 'Add new device configuration data for the authenticated device',
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
      notes: 'Adds new device operational data for the authenticated device',
      validate: {
        payload: {
          data: Joi.object().required()
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/result',
    handler: asyncHandler(addResult),
    config: {
      description: 'Result',
      notes: 'Adds new assay result data for the authenticated device',
      validate: {
        payload: {
          uniqueId: Joi.string(),
          data: Joi.object().required()
        }
      }
    }
  }
]
