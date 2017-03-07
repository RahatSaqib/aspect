// All Device API endpoints in this file are relative to /device/ and
// require Device Token authentication. In general, a POST to /device
// also has a corresponding endpoint to a single update, for example,
// POST /device {result: {}} is equivalent to POST /device/result if
// only result data is posted.
const Joi = require('joi')
const { deviceApiHandler } = require('./common')
const {
  addDeviceData,
  getDeviceData,
  addDeviceOperation,
  updateDeviceConfiguration } = require('./device')
const { addResult } = require('./result')

const errorPayload = Joi.object().keys({
  code: Joi.string().allow('', null).description(
    'Error code'),
  notes: Joi.string().allow('', null).description(
    'Description of the error')
})

const devicePayload = {
  name: Joi.string().allow('', null).description('The device name'),
  serial: Joi.string().allow('', null).description('The device serial number'),
  type: Joi.object().keys({
    id: Joi.string().required().description('The Device Type. Required on first request with API Key')
  }),
  site: Joi.object().keys({
    id: Joi.string().required().description(
      'ID of the site where the device is located')
  })
}

const configurationPayload = {
  checkpoint: Joi.string().allow('', null).description(
    'The client checkpoint'),
  data: Joi.object().required().description(
    'Device configuration data.  The valid keys are dependent on Device Type.')
}

const operationPayload = {
  checkpoint: Joi.string().allow('', null).description(
    'The client checkpoint'),
  startedOn: Joi.date().iso().description(
    'Date and optional time the operation began. If only one date is available, use endedOn'),
  endedOn: Joi.date().iso().description(
    'Date and optional time the operation finished.'),
  data: Joi.object().required().description(
    'Device operational data.  The valid keys are dependent on Device Type.')
}

const resultPayload = {
  id: Joi.string().allow('', null).description(
    'Identifies this result to allow future updates.  If the ID is specified by the client,'
    + ' multiple result updates with the same ID will merge into the same result.  If no ID is'
    + ' specified, a new result is created with every POST.'),
  checkpoint: Joi.string().allow('', null).description('The client checkpoint'),
  startedOn: Joi.date().iso().description(
    'Date and optional time the test began. If only one date is available, use endedOn'),
  endedOn: Joi.date().iso().description(
    'Date and optional time the test finished.'),
  data: Joi.object().description(
    'Assay dependent test result data.'),
  assay: Joi.object().keys({
    id: Joi.string().required().description(
      'A known Assay configured within Aspect.'),
    version: Joi.string().allow('', null).description(
      'Version of assay specfied by Device')
  }),
  location: Joi.object().keys({
    latitude: Joi.number().description(
      'Latitude where the test was collected. Will default to the site location'),
    longitude: Joi.number().description(
      'Longitude where the test was collected. Will default to the site location')
  }),
  type: Joi.object().keys({
    id: Joi.string().required().description('The Result Type.  Defaults to Patient.')
  }),
  workflow: Joi.object().keys({
    status: Joi.object().keys({
      id: Joi.string().required().description(
        'The workflow status. Default Error if error specified, otherwise OK')
    }),
    operator: Joi.string().allow('', null).description(
      'The person who updated the workflow'),
    changedOn: Joi.date().iso().description(
      'Date and optional time the workflow changed.')
  }),
  sample: Joi.object().keys({
    id: Joi.string().allow('', null).description(
      'Client specific identifier of the sample tested.'),
    collectedOn: Joi.date().iso().description(
      'Date and optional time the sample was collected.'),
    runNumber: Joi.string().allow('', null).description(
      'Sample run number.'),
    type: Joi.object().keys({
      id: Joi.string().required().description(
        'ID of the Sample Type')
    }),
    originSite: Joi.object().keys({
      id: Joi.string().required().description(
        'ID of the site where the sample was collected')
    })
  }),
  category: Joi.array().items(
    Joi.object().keys({
      id: Joi.string().required().description(
        'Assay dependent categorization of the Result.  Default Error if error specified,'
        + ' otherwise OK. If the Assay supports only a single category, can send a single'
        + ' JSON object instead of an Array.'
      )
    })
  ).min(0).max(2).single(true),
  consumable: Joi.array().items(
    Joi.object().keys({
      serial: Joi.string().allow('', null).description(
        'Serial Number of inventory item consumed during completion of this test'),
      lot: Joi.string().allow('', null).description(
        'Lot Number of inventory item consumed during completion of this test'),
      expirationDate: Joi.date().iso().description(
        'Expiration Date of inventory item consumed during completion of this test'),
    })
  ).min(0).max(1).single(true),
  instrument: Joi.object().keys({
    serial: Joi.string().allow('', null).description(
      'Serial number of insrument used to collect the test results'),
    module: Joi.object().keys({
      name: Joi.string().allow('', null).description(
        'Name of module enabled by the instrument while collecting the test results'),
      serial: Joi.string().allow('', null).description(
        'Name of module enabled by the instrument while collecting the test results'),
    }),
  }),
  research: Joi.object().keys({
    id: Joi.string().allow('', null).description(
      'Identifies a research study for which the test is completed.')
  }),
  patient: Joi.object().keys({
    id: Joi.string().allow('', null).description(
      'Patient Identifier'),
    name: Joi.string().allow('', null).description(
      'Patient name'),
    surname: Joi.string().allow('', null).description(
      'Patient surname'),
    gender: Joi.string().allow('', null).description(
      'Patient gender (M/F)'),
    age: Joi.number().allow(null).description(
       'Patient age (years)'),
    dateOfBirth: Joi.date().iso().allow(null).description(
       'Patient date of birth'),
    address: Joi.string().allow('', null).description(
       'Patient address'),
    phone: Joi.string().allow('', null).description(
       'Patient phone number')
  }),
  sender: Joi.object().keys({
    version: Joi.string().allow('', null).description(
      'Version of software used, separate from the instrument, to complete the test'),
    operator: Joi.string().allow('', null).description(
      'The person who completed the test')
  }),
  notes: Joi.string().allow('', null).description(
    'Any additional notes associated with this result'),
  error: errorPayload
}

module.exports = [
  {
    // GET /device
    method: 'GET',
    path: '/',
    handler: deviceApiHandler(getDeviceData, { requiredStatus: 'approved', requestDeviceLog: true }),
    config: {
      description: 'Get Device Data',
      notes: 'Get device configuration, operational and result data since the specified checkpoint.'
        + ' If not specified, returns assigned site and last checkpoint posted for device.',
      validate: {
        query: {
          checkpoint: Joi.string().description(
            'The client checkpoint.  If the checkpoint is specified, will retrieve data uploaded'
            + ' with that checkpoint.  Otherwise will return data that does not depend on checkpoint.'),
          offset: Joi.string().description(
            'The result offset from the  client checkpoint, default 0. If offset is 0, device data'
            + ' uploaded with the specified checkpoint will be retreived. A positive offset will retreive'
            + ' the data uploaded after the checkpoint, e.g. to download data updated after the last'
            + ' Device Checkin from an outside source. A negative offset will retreive data uploaded'
            + ' before the checkpoint, e.g. to download historical data')
        }
      },
      response: {
        options: {
          allowUnknown: true
        },
        schema: Object.assign({}, devicePayload, {
          checkpoint: Joi.string().allow('', null).description(
            'The client checkpoint'),
          configuration: Joi.object().keys(configurationPayload).description(
            'Device Configuration Data'),
          operation: Joi.object().keys(operationPayload).description(
            'Device Operation Data'),
          result: Joi.object().keys(resultPayload).description(
            'Device Result Data.'),
          error: errorPayload
        })
      }
    }
  },
  {
    // POST /device { checkpoint, configuration, operation, result }
    method: 'POST',
    path: '/',
    handler: deviceApiHandler(addDeviceData, {
      createDevice: true, updatePing: true, updateDeviceLog: true }),
    config: {
      description: 'Update Device Data',
      notes: 'Updates latest device configuration, operational and result data in a single request.',
      validate: {
        options: {
          allowUnknown: true
        },
        payload: Joi.object().keys(Object.assign({}, devicePayload, {
          name: Joi.string().allow('', null).description(
            'The device name'),
          checkpoint: Joi.string().allow('', null).description(
            'The client checkpoint'),
          configuration: Joi.object().keys(configurationPayload).description(
            'Device Configuration Data'),
          operation: Joi.object().keys(operationPayload).description(
            'Device Operation Data'),
          result: Joi.object().keys(resultPayload).description(
            'Device Result Data.')
        })),
      },
      response: {
        schema: {
          error: errorPayload
        }
      }
    }
  },
  {
    // POST /device/configuration
    method: 'POST',
    path: '/configuration',
    handler: deviceApiHandler(
      updateDeviceConfiguration, { updatePing: true, updateDeviceLog: true }),
    config: {
      description: 'Update Device Configuration',
      notes: 'Device configuration information, such as firmware revision, software versions,'
        + ' serial numbers, etc.',
      validate: {
        payload: configurationPayload
      },
      response: {
        schema: {
          error: errorPayload
        }
      }
    }
  },
  {
    // POST /device/operation
    method: 'POST',
    path: '/operation',
    handler: deviceApiHandler(addDeviceOperation, { updatePing: true, updateDeviceLog: true }),
    config: {
      description: 'Update Device Operation',
      notes: 'Devices may deliver operational information to Aspect, such as uptime, communication'
        + ' statistics, status of mechanical systems, calibration information etc. ',
      validate: {
        payload: operationPayload
      },
      response: {
        schema: {
          error: errorPayload
        }
      }
    }
  },
  {
    // POST /device/result
    method: 'POST',
    path: '/result',
    handler: deviceApiHandler(addResult, { updatePing: true, updateDeviceLog: true }),
    config: {
      description: 'Update Result',
      notes: 'Deliver test results. This could include not only an assay result, but also QC'
        + ' information, reagent information, operator ID, cartridge serial numbers, and other'
        + ' information useful for interpreting the test result. ',
      validate: {
        options: {
          allowUnknown: true
        },
        payload: resultPayload
      },
      response: {
        schema: {
          error: errorPayload
        }
      }
    }
  }
]
