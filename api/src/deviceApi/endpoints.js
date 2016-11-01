let Joi = require('joi')
let { asyncHandler } = require('../routes')
let { addDeviceOperation, addDeviceConfiguration} = require('./device')
let { addResult} = require('./result')

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
          id: Joi.string(),
          assay: Joi.object().keys({
            id: Joi.string(),
            version: Joi.string()
          }),
          location: Joi.object().keys({
            latitude: Joi.number(),
            longitude: Joi.number()
          }),
          type: Joi.object().keys({
            id: Joi.string()
          }),
          sample: Joi.object().keys({
            id: Joi.string(),
            originSiteId: Joi.string()
          }),
          category: Joi.array().items(
            Joi.object().keys({
              id: Joi.string()
            })
          ).min(0).max(2).single(true),
          data: Joi.object().required(),
          startedOn: Joi.date().iso(),
          endedOn: Joi.date().iso().required(),
          consumable: Joi.array().items(
            Joi.object().keys({
              serial: Joi.string(),
              lot: Joi.string(),
              expirationDate: Joi.date().iso()
            })
          ).min(0).max(1).single(true),
          instrument: Joi.object().keys({
            serial: Joi.string()
          }),
          module: Joi.object().keys({
            name: Joi.string(),
            serial: Joi.string()
          }),
          research: Joi.object().keys({
            id: Joi.string()
          }),
          patient: Joi.object().keys({
            id: Joi.string()
          }),
          sender: Joi.object().keys({
            version: Joi.string(),
            operator: Joi.string()
          }),
          notes: Joi.string(),
          error: Joi.object().keys({
            code: Joi.string(),
            notes: Joi.string()
          })
        }
      }
    }
  }
]
