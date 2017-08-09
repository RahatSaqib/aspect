// All Device API endpoints in this file are relative to /device/ and
// require Device Token authentication. In general, a POST to /device
// also has a corresponding endpoint to a single update, for example,
// POST /device {result: {}} is equivalent to POST /device/result if
// only result data is posted.
const Joi = require('joi')
const {
  deviceApiHandler,
  DEVICE_LOG_TYPE_OPTIONAL,
  DEVICE_LOG_TYPE_OPERATION,
  DEVICE_LOG_TYPE_RESULT,
} = require('./common')
const {
  addDeviceData,
  getDeviceData,
  addDeviceOperation,
  updateDeviceConfiguration,
} = require('./device')
const { addResult } = require('./result')

const errorPayload = Joi.object().keys({
  code: Joi.string().allow('', null).description('Error code'),
  notes: Joi.string().allow('', null).description('Description of the error'),
})

const logPayload = {
  source: Joi.string()
    .allow('', null)
    .description('The source of the log, determined by client'),
}

const logResponse = Object.assign(
  {},
  {
    createdOn: Joi.date()
      .iso()
      .description('Date the log was created, in server time.'),
  },
  logPayload
)

const devicePayload = {
  name: Joi.string().allow('', null).description('The device name'),
  serial: Joi.string().allow('', null).description('The device serial number'),
  status: Joi.object().keys({
    id: Joi.string()
      .required()
      .description(
        'The device status. Only approved devices will deliver results.'
      ),
  }),
  type: Joi.object().keys({
    id: Joi.string()
      .required()
      .description('The Device Type. Required on first request with API Key'),
  }),
  site: Joi.object().keys({
    id: Joi.string()
      .required()
      .description('ID of the site where the device is located'),
  }),
}

const configurationPayload = {
  checkpoint: Joi.string().allow('', null).description('The client checkpoint'),
  data: Joi.object()
    .required()
    .description(
      'Device configuration data.  The valid keys are dependent on Device Type.'
    ),
}

const operationPayload = {
  checkpoint: Joi.string().allow('', null).description('The client checkpoint'),
  startedOn: Joi.date()
    .iso()
    .description(
      'Date and optional time the operation began. If only one date is available, use endedOn'
    ),
  endedOn: Joi.date()
    .iso()
    .description('Date and optional time the operation finished.'),
  data: Joi.object()
    .required()
    .description(
      'Device operational data.  The valid keys are dependent on Device Type.'
    ),
}

const resultPayload = {
  id: Joi.string()
    .allow('', null)
    .description(
      'Identifies this result to allow future updates.  If the ID is specified by the client,' +
        ' multiple result updates with the same ID will merge into the same result.  If no ID is' +
        ' specified, a new result is created with every POST.'
    ),
  checkpoint: Joi.string().allow('', null).description('The client checkpoint'),
  startedOn: Joi.date()
    .iso()
    .description(
      'Date and optional time the test began. If only one date is available, use endedOn'
    ),
  endedOn: Joi.date()
    .iso()
    .description('Date and optional time the test finished.'),
  data: Joi.object().description('Assay dependent test result data.'),
  assay: Joi.object().keys({
    id: Joi.string()
      .required()
      .description('A known Assay configured within Aspect.'),
    version: Joi.string()
      .allow('', null)
      .description('Version of assay specfied by Device'),
  }),
  location: Joi.object().keys({
    latitude: Joi.number().description(
      'Latitude where the test was collected. Will default to the site location'
    ),
    longitude: Joi.number().description(
      'Longitude where the test was collected. Will default to the site location'
    ),
  }),
  type: Joi.object().keys({
    id: Joi.string()
      .required()
      .description('The Result Type. Defaults to Patient.'),
  }),
  source: Joi.object().keys({
    id: Joi.string()
      .required()
      .description('The Result Source. Defaults to "Diagnostic Device".'),
  }),
  workflow: Joi.object().keys({
    status: Joi.object().keys({
      id: Joi.string()
        .required()
        .description(
          'The workflow status. Default Error if error specified, otherwise OK'
        ),
    }),
    operator: Joi.string()
      .allow('', null)
      .description('The person who updated the workflow'),
    changedOn: Joi.date()
      .iso()
      .description('Date and optional time the workflow changed.'),
  }),
  sample: Joi.object().keys({
    id: Joi.string()
      .allow('', null)
      .description('Client specific identifier of the sample tested.'),
    collectedOn: Joi.date()
      .iso()
      .description('Date and optional time the sample was collected.'),
    group: Joi.string()
      .allow('', null)
      .description('The group, collection, or worksheet of a sample'),
    runNumber: Joi.string().allow('', null).description('Sample run number.'),
    type: Joi.object().keys({
      id: Joi.string().required().description('ID of the Sample Type'),
    }),
    originSite: Joi.object().keys({
      id: Joi.string()
        .required()
        .description('ID of the site where the sample was collected'),
    }),
  }),
  category: Joi.array()
    .items(
      Joi.object().keys({
        id: Joi.string()
          .required()
          .description(
            'Assay dependent categorization of the Result.  Default Error if error specified,' +
              ' otherwise OK. If the Assay supports only a single category, can send a single' +
              ' JSON object instead of an Array.'
          ),
      })
    )
    .min(0)
    .max(2)
    .single(true),
  consumable: Joi.array()
    .items(
      Joi.object().keys({
        serial: Joi.string()
          .allow('', null)
          .description(
            'Serial Number of inventory item consumed during completion of this test'
          ),
        lot: Joi.string()
          .allow('', null)
          .description(
            'Lot Number of inventory item consumed during completion of this test'
          ),
        expirationDate: Joi.date()
          .iso()
          .description(
            'Expiration Date of inventory item consumed during completion of this test'
          ),
      })
    )
    .min(0)
    .max(1)
    .single(true),
  instrument: Joi.object().keys({
    serial: Joi.string()
      .allow('', null)
      .description(
        'Serial number of insrument used to collect the test results'
      ),
    module: Joi.object().keys({
      name: Joi.string()
        .allow('', null)
        .description(
          'Name of module enabled by the instrument while collecting the test results'
        ),
      serial: Joi.string()
        .allow('', null)
        .description(
          'Name of module enabled by the instrument while collecting the test results'
        ),
    }),
  }),
  research: Joi.object().keys({
    id: Joi.string()
      .allow('', null)
      .description(
        'Identifies a research study for which the test is completed.'
      ),
  }),
  patient: Joi.object().keys({
    id: Joi.string().allow('', null).description('Patient Identifier'),
    name: Joi.string().allow('', null).description('Patient name'),
    surname: Joi.string().allow('', null).description('Patient surname'),
    gender: Joi.string().allow('', null).description('Patient gender (M/F)'),
    age: Joi.number().allow(null).description('Patient age (years)'),
    dateOfBirth: Joi.date()
      .iso()
      .allow(null)
      .description('Patient date of birth'),
    address: Joi.string().allow('', null).description('Patient address'),
    phone: Joi.string().allow('', null).description('Patient phone number'),
  }),
  sender: Joi.object().keys({
    version: Joi.string()
      .allow('', null)
      .description(
        'Version of software used, separate from the instrument, to complete the test'
      ),
    operator: Joi.string()
      .allow('', null)
      .description('The person who completed the test'),
  }),
  oemData: Joi.any().description('Proprietary data for OEM'),
  rawData: Joi.any().description(
    'Field for sending raw data directly from a device'
  ),
  notes: Joi.string()
    .allow('', null)
    .description('Any additional notes associated with this result'),
  error: errorPayload,
}

module.exports = [
  {
    // GET /device
    method: 'GET',
    path: '/',
    handler: deviceApiHandler(getDeviceData, {
      deviceLogType: DEVICE_LOG_TYPE_OPTIONAL,
    }),
    config: {
      description: 'Get Device Data',
      notes:
        'Get device configuration, operational and result data since the specified checkpoint.' +
        ' If not specified, returns assigned site and last checkpoint posted for device.',
      validate: {
        query: {
          checkpoint: Joi.string().description(
            'The client checkpoint.  If the checkpoint is specified, will retrieve data uploaded' +
              ' with that checkpoint.  Otherwise will return data that does not depend on checkpoint.'
          ),
          offset: Joi.string().description(
            'The result offset from the  client checkpoint, default 0. If offset is 0, device data' +
              ' uploaded with the specified checkpoint will be retrieved. A positive offset will retrieve' +
              ' the data uploaded after the checkpoint, e.g. to download data updated after the last' +
              ' Device Checkin from an outside source. A negative offset will retrieve data uploaded' +
              ' before the checkpoint, e.g. to download historical data'
          ),
        },
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: Object.assign({}, devicePayload, {
          checkpoint: Joi.string()
            .allow('', null)
            .description('The client checkpoint'),
          log: Joi.object().keys(logResponse).description('Device Log Data'),
          configuration: Joi.object()
            .keys(configurationPayload)
            .description('Device Configuration Data'),
          operation: Joi.object()
            .keys(operationPayload)
            .description('Device Operation Data'),
          result: Joi.object()
            .keys(resultPayload)
            .description('Device Result Data.'),
          error: errorPayload,
        }),
      },
    },
  },
  {
    // POST /device { checkpoint, configuration, operation, result }
    method: 'POST',
    path: '/',
    handler: deviceApiHandler(addDeviceData, {
      createDevice: true,
      updatePing: true,
      updateDeviceLog: true,
    }),
    config: {
      description: 'Update Device Data',
      notes:
        'Updates latest device configuration, operational and result data in a single request.',
      validate: {
        options: {
          allowUnknown: true,
        },
        payload: Joi.object().keys(
          Object.assign({}, devicePayload, {
            name: Joi.string().allow('', null).description('The device name'),
            checkpoint: Joi.string()
              .allow('', null)
              .description('The client checkpoint'),
            log: Joi.object().keys(logPayload).description('Device Log Data'),
            configuration: Joi.object()
              .keys(configurationPayload)
              .description('Device Configuration Data'),
            operation: Joi.object()
              .keys(operationPayload)
              .description('Device Operation Data'),
            result: Joi.object()
              .keys(resultPayload)
              .description('Device Result Data.'),
          })
        ),
      },
      response: {
        schema: {
          error: errorPayload,
        },
      },
    },
  },
  {
    // POST /device/configuration
    method: 'POST',
    path: '/configuration',
    handler: deviceApiHandler(updateDeviceConfiguration, {
      updatePing: true,
      updateDeviceLog: true,
    }),
    config: {
      description: 'Update Device Configuration',
      notes:
        'Device configuration information, such as firmware revision, software versions,' +
        ' serial numbers, etc.',
      validate: {
        payload: Object.assign({}, configurationPayload, {
          log: Joi.object().keys(logPayload).description('Device Log Data'),
        }),
      },
      response: {
        schema: {
          error: errorPayload,
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/operation',
    handler: deviceApiHandler(getDeviceData, {
      deviceLogType: DEVICE_LOG_TYPE_OPERATION,
    }),
    config: {
      notes: 'Get device operational data',
      description:
        'Get last updated operation data for the authenticated device given search constraints',
      validate: {
        query: {
          checkpoint: Joi.string(),
          offset: Joi.string(),
        },
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          checkpoint: Joi.string()
            .allow('', null)
            .description('The client checkpoint'),
          log: Joi.object().keys(logResponse).description('Device Log Data'),
          operation: Joi.object()
            .keys(operationPayload)
            .description('Device Operation Data'),
          error: errorPayload,
        },
      },
    },
  },
  {
    // POST /device/operation
    method: 'POST',
    path: '/operation',
    handler: deviceApiHandler(addDeviceOperation, {
      updatePing: true,
      updateDeviceLog: true,
    }),
    config: {
      description: 'Update Device Operation',
      notes:
        'Devices may deliver operational information to Aspect, such as uptime, communication' +
        ' statistics, status of mechanical systems, calibration information etc. ',
      validate: {
        payload: Object.assign({}, resultPayload, {
          log: Joi.object().keys(logPayload).description('Device Log Data'),
        }),
      },
      response: {
        schema: {
          error: errorPayload,
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/result',
    handler: deviceApiHandler(getDeviceData, {
      deviceLogType: DEVICE_LOG_TYPE_RESULT,
    }),
    config: {
      notes: 'Get result data',
      description:
        'Get last updated result data for the authenticated device given search constraints',
      validate: {
        query: {
          checkpoint: Joi.string(),
          offset: Joi.string(),
        },
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          checkpoint: Joi.string()
            .allow('', null)
            .description('The client checkpoint'),
          log: Joi.object().keys(logResponse).description('Device Log Data'),
          result: Joi.object()
            .keys(resultPayload)
            .description('Device Result Data.'),
          error: errorPayload,
        },
      },
    },
  },
  {
    // POST /device/result
    method: 'POST',
    path: '/result',
    handler: deviceApiHandler(addResult, {
      updatePing: true,
      updateDeviceLog: true,
    }),
    config: {
      description: 'Update Result',
      notes:
        'Deliver test results. This could include not only an assay result, but also QC' +
        ' information, reagent information, operator ID, cartridge serial numbers, and other' +
        ' information useful for interpreting the test result. ',
      validate: {
        options: {
          allowUnknown: true,
        },
        payload: Object.assign({}, resultPayload, {
          log: Joi.object().keys(logPayload).description('Device Log Data'),
        }),
      },
      response: {
        schema: {
          error: errorPayload,
        },
      },
    },
  },
]
