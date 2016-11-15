const Joi = require('joi')
const { deviceApiHandler } = require('./common')
const { ping, addDeviceOperation, addDeviceConfiguration} = require('./device')
const { addResult, listResults } = require('./result')

const configurationPayload = {
  data: Joi.object().required()
}

const operationPayload = {
  data: Joi.object().required()
}

const resultPayload = {
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
  workflow: Joi.object().keys({
    status: Joi.object().keys({
      id: Joi.string().required()
    })
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

module.exports = [
  {
    method: 'POST',
    path: '/',
    handler: deviceApiHandler(ping, {updatePing: true}),
    config: {
      notes: 'Add Device Configuration, operation or Result',
      description: 'Add new device configuration, operation or result data for the authenticated device',
      validate: {
        payload: Joi.object().keys({
          configuration: Joi.object().keys(configurationPayload),
          operation: Joi.object().keys(configurationPayload),
          result: Joi.object().keys(resultPayload)
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/configuration',
    handler: deviceApiHandler(addDeviceConfiguration, {updatePing: true}),
    config: {
      notes: 'Add Device Configuration',
      description: 'Add new device configuration data for the authenticated device',
      validate: {
        payload: configurationPayload
      }
    }
  },
  {
    method: 'POST',
    path: '/operation',
    handler: deviceApiHandler(addDeviceOperation, {updatePing: true}),
    config: {
      description: 'Device Operation',
      notes: 'Adds new device operational data for the authenticated device',
      validate: {
        payload: operationPayload
      }
    }
  },
  {
    method: 'GET',
    path: '/result',
    handler: deviceApiHandler(listResults, {updatePing: false}),
    config: {
      description: 'Result List',
      notes: 'List of results for authenticated device',
      validate: {
        query: {
          updatedSince: Joi.date().iso().required()
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/result',
    handler: deviceApiHandler(addResult, {updatePing: true}),
    config: {
      description: 'Result',
      notes: 'Adds new assay result data for the authenticated device',
      validate: {
        options: {
          allowUnknown: true
        },
        payload: resultPayload
      }
    }
  }
]
