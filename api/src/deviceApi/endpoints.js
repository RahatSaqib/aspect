let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../routes')
let { addDeviceOperation, addDeviceConfiguration} = require('./device')
let { addResult, listResults } = require('./result')

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
    method: 'GET',
    path: '/result',
    handler: asyncHandler(listResults),
    config: {
      description: 'Result List',
      notes: 'Pageable and sortable list of results for authenticated device',
      validate: {
        query: Object.assign({
        }, validateSortPageParams('endedOn', 'updatedOn'))
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
          id: Joi.string().allow('', null),
          assay: Joi.object().keys({
            id: Joi.string().required(),
            version: Joi.string().allow('', null)
          }),
          location: Joi.object().keys({
            latitude: Joi.number(),
            longitude: Joi.number()
          }),
          type: Joi.object().keys({
            id: Joi.string().required()
          }),
          sample: Joi.object().keys({
            id: Joi.string().allow('', null),
            originSite: Joi.object().keys({
              id: Joi.string().required()
            })
          }),
          category: Joi.array().items(
            Joi.object().keys({
              id: Joi.string().required()
            })
          ).min(0).max(2).single(true),
          data: Joi.object(),
          startedOn: Joi.date().iso(),
          endedOn: Joi.date().iso(),
          consumable: Joi.array().items(
            Joi.object().keys({
              serial: Joi.string().allow('', null),
              lot: Joi.string().allow('', null),
              expirationDate: Joi.date().iso()
            })
          ).min(0).max(1).single(true),
          instrument: Joi.object().keys({
            serial: Joi.string().allow('', null)
          }),
          module: Joi.object().keys({
            name: Joi.string().allow('', null),
            serial: Joi.string().allow('', null)
          }),
          research: Joi.object().keys({
            id: Joi.string().allow('', null)
          }),
          patient: Joi.object().keys({
            id: Joi.string().allow('', null),
            name: Joi.string().allow('', null),
            surname: Joi.string().allow('', null),
            gender: Joi.string().allow('', null),
            age: Joi.number().allow(null),
            dateOfBirth: Joi.date().iso().allow(null),
            address: Joi.string().allow('', null),
            phone: Joi.string().allow('', null)
          }),
          sender: Joi.object().keys({
            version: Joi.string().allow('', null),
            operator: Joi.string().allow('', null)
          }),
          notes: Joi.string().allow('', null),
          error: Joi.object().keys({
            code: Joi.string().allow('', null),
            notes: Joi.string().allow('', null)
          })
        }
      }
    }
  }
]
