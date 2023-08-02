// All Device API endpoints in this file are relative to /device/ and
// require Device Token authentication. In general, a POST to /device
// also has a corresponding endpoint to a single update, for example,
// POST /device {result: {}} is equivalent to POST /device/result if
// only result data is posted.
const Joi = require('@hapi/joi')
const {
  getDeviceDataHandler,
  getDeviceOperationHandler,
  getResultHandler,
  addDeviceDataHandler,
  addDeviceDataFastHandler,
  addPluginDeviceDataHandler,
  addDeviceOperationHandler,
  updateDeviceConfigurationHandler,
  mergeResultHandler,
  addDeviceLog,
  getHealthStatsHandler,
  getResultPakistanHandler,
} = require('./service')

const errorPayload = Joi.object()
  .allow(null)
  .keys({
    code: Joi.string().allow('', null).description('Error code'),
    notes: Joi.string().allow('', null).description('Description of the error'),
  })
const logItem = {
  externalId: Joi.alternatives()
    .try(Joi.string(), Joi.number())
    .allow('', null)
    .description('External unique id of the entry in remote system'),
  occurredOn: Joi.date().required().iso().description('Date/time of when log entry happened'),
  logFileName: Joi.string().required().description('Log file name'),
  logLevel: Joi.string().required().description('Log Level (INFO, ERROR, etc)'),
  details: Joi.alternatives()
    .try(
      Joi.object().description('Log details JSON - error code, content of the log entry, log file name, category'),
      Joi.string().description('Log details stringified - to be parsed at run-time')
    )
    .required(),
}
const logPayload = {
  source: Joi.string().allow('', null).description('The source of the log, determined by client'),
  data: Joi.alternatives()
    .allow(null)
    .try(Joi.object().keys(logItem), Joi.array().items(Joi.object().keys(logItem))),
}

const logResponse = {
  createdOn: Joi.date().iso().description('Date the log was created, in server time.'),
  ...logPayload,
}

const devicePayload = {
  name: Joi.string().allow('', null).description('The device name'),
  serial: Joi.string().allow('', null).description('The device serial number'),
  approval: Joi.object()
    .allow(null)
    .keys({
      id: Joi.string()
        .required()
        .description('The device approval status. Only approved devices will deliver results.'),
    }),
  type: Joi.object()
    .allow(null)
    .keys({
      id: Joi.string().required().description('The Device Type. Required on first request with API Key'),
    }),
  site: Joi.object()
    .allow(null)
    .keys({
      id: Joi.string().required().description('ID of the site where the device is located'),
    }),
}

const configurationPayload = {
  data: Joi.object().required().description('Device configuration data.  The valid keys are dependent on Device Type.'),
}

const operationPayload = {
  startedOn: Joi.date()
    .iso()
    .description('Date and optional time the operation began. If only one date is available, use endedOn'),
  endedOn: Joi.date().iso().description('Date and optional time the operation finished.'),
  data: Joi.object().required().description('Device operational data.  The valid keys are dependent on Device Type.'),
}

const resultPayload = {
  id: Joi.string()
    .allow('', null)
    .description(
      'Identifies this result to allow future updates.  If the ID is specified by the client,' +
        ' multiple result updates with the same ID will merge into the same result.  If no ID is' +
        ' specified, a new result is created with every POST.'
    ),
  startedOn: Joi.date()
    .allow(null)
    .iso()
    .description('Date and optional time the test began. If only one date is available, use endedOn'),
  endedOn: Joi.date().allow(null).iso().description('Date and optional time the test finished.'),
  data: Joi.object().description('Assay dependent test result data.'),
  assay: Joi.object().keys({
    id: Joi.string().required().description('A known Assay configured within Aspect.'),
    version: Joi.string().allow('', null).description('Version of assay specified by Device'),
  }),
  location: Joi.object()
    .allow(null)
    .keys({
      latitude: Joi.number().description('Latitude where the test was collected. Will default to the site location'),
      longitude: Joi.number().description('Longitude where the test was collected. Will default to the site location'),
    }),
  type: Joi.object()
    .allow(null)
    .keys({
      id: Joi.string().required().description('The Result Type. Defaults to Patient.'),
    }),
  source: Joi.object()
    .allow(null)
    .keys({
      id: Joi.string().required().description('The Result Source. Defaults to "Diagnostic Device".'),
    }),
  workflow: Joi.object()
    .allow(null)
    .keys({
      status: Joi.object().keys({
        id: Joi.string().required().description('The workflow status. Default Error if error specified, otherwise OK'),
      }),
      operator: Joi.string().allow('', null).description('The person who updated the workflow'),
      changedOn: Joi.date().iso().description('Date and optional time the workflow changed.'),
    }),
  sample: Joi.object().keys({
    id: Joi.string().allow('', null).description('Client specific identifier of the sample tested.'),
    collectedOn: Joi.date().allow(null).iso().description('Date and optional time the sample was collected.'),
    group: Joi.string().allow('', null).description('The group, collection, or worksheet of a sample'),
    runNumber: Joi.string().allow('', null).description('Sample run number.'),
    type: Joi.object()
      .allow(null)
      .keys({
        id: Joi.string().required().description('ID of the Sample Type'),
      }),
    originSite: Joi.object()
      .allow(null)
      .keys({
        id: Joi.string().required().description('ID of the site where the sample was collected'),
        name: Joi.string().allow('', null).description('Name of the site where the sample was collected'),
        shortName: Joi.string().allow('', null).description('Short name of the site where the sample was collected'),
        notes: Joi.string().allow('', null).description('Notes about the site where the sample was collected'),
        state: Joi.string().allow('', null).description('Name of the state or province where the sample was collected'),
        lga: Joi.string()
          .allow('', null)
          .description('Short name of the LGA or district where the sample was collected'),
        city: Joi.string().allow('', null).description('City name of the site where the sample was collected'),
        street1: Joi.string()
          .allow('', null)
          .description('Address (line 1) of the site where the sample was collected'),
        street2: Joi.string()
          .allow('', null)
          .description('Address (line 2) of the site where the sample was collected'),
        zip: Joi.string().allow('', null).description('Zip/Postal code of the site where the sample was collected'),
        location: Joi.object()
          .allow(null)
          .keys({
            latitude: Joi.number().description(
              'Latitude where the sample was collected. Will default to the site location'
            ),
            longitude: Joi.number().description(
              'Longitude where the sample was collected. Will default to the site location'
            ),
          }),
        timezoneId: Joi.string()
          .allow('', null)
          .description('The timezone for the site (format: Myanmar Standard Time)'),
        hoursStart: Joi.number().allow('', null).description('The hour that the site opens on a working day'),
        hoursEnd: Joi.number().allow('', null).description('The hour that the site closes on a working day'),
      }),
  }),
  category: Joi.array()
    .allow(null)
    .items(
      Joi.object().keys({
        id: Joi.string()
          .required()
          .description(
            'Assay dependent categorization of the Result.  Default Error if error specified,' +
              ' otherwise Success. If the Assay supports only a single category, can send a single' +
              ' JSON object instead of an Array.'
          ),
      })
    )
    .min(0)
    .max(2)
    .single(true),
  consumable: Joi.array()
    .allow(null)
    .items(
      Joi.object().keys({
        serial: Joi.string()
          .allow('', null)
          .description('Serial Number of inventory item consumed during completion of this test'),
        lot: Joi.string()
          .allow('', null)
          .description('Lot Number of inventory item consumed during completion of this test'),
        expirationDate: Joi.date()
          .allow(null)
          .iso()
          .description('Expiration Date of inventory item consumed during completion of this test'),
      })
    )
    .min(0)
    .max(1)
    .single(true),
  instrument: Joi.object().keys({
    serial: Joi.string().allow('', null).description('Serial number of insrument used to collect the test results'),
    module: Joi.object().keys({
      name: Joi.string()
        .allow('', null)
        .description('Name of module enabled by the instrument while collecting the test results'),
      serial: Joi.string()
        .allow('', null)
        .description('Name of module enabled by the instrument while collecting the test results'),
    }),
  }),
  research: Joi.object()
    .allow(null)
    .keys({
      id: Joi.string().allow('', null).description('Identifies a research study for which the test is completed.'),
    }),
  patient: Joi.object().keys({
    id: Joi.string().allow('', null).description('Patient Identifier'),
    name: Joi.string().allow('', null).description('Patient name'),
    surname: Joi.string().allow('', null).description('Patient surname'),
    gender: Joi.string().allow('', null).description('Patient gender (M/F)'),
    age: Joi.number().allow(null).description('Patient age (years)'),
    dateOfBirth: Joi.date().iso().allow(null).description('Patient date of birth'),
    address: Joi.string().allow('', null).description('Patient address'),
    street: Joi.string().allow('', null).description('Patient street'),
    city: Joi.string().allow('', null).description('Patient city'),
    state: Joi.string().allow('', null).description('Patient state'),
    zip: Joi.string().allow('', null).description('Patient ZIP/Postal code'),
    phone: Joi.string().allow('', null).description('Patient phone number'),
    hivStatus: Joi.string().allow('', null).description("Patient's HIV Status"),
    microscopyResult: Joi.string().allow('', null).description("Patient's microscopy result"),
    drSuspect: Joi.string().allow('', null).description('Suspected Drug Resistance'),
    previouslyTreated: Joi.string().allow('', null).description('Has patient been previously treated?'),
  }),
  sender: Joi.object().keys({
    version: Joi.string()
      .allow('', null)
      .description('Version of software used, separate from the instrument, to complete the test'),
    operator: Joi.string().allow('', null).description('The person who completed the test'),
  }),
  oemData: Joi.any().description('Proprietary data for OEM'),
  rawData: Joi.any().description('Field for sending raw data directly from a device'),
  notes: Joi.string().allow('', null).description('Any additional notes associated with this result'),
  error: errorPayload,
}

const routes = [
  {
    // GET /device
    method: 'GET',
    path: '/',
    handler: getDeviceDataHandler,
    config: {
      description: 'Get Device Data',
      notes: 'Get device configuration, operational and result data returns assigned site',
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          ...devicePayload,
          log: Joi.object().keys(logResponse).description('Device Log Data'),
          configuration: Joi.object().keys(configurationPayload).description('Device Configuration Data'),
          operation: Joi.object().keys(operationPayload).description('Device Operation Data'),
          deviceConfiguration: Joi.object().description(
            'Device Configuration is a json object for configuring the whole country/state network of gxconnect instances.'
          ),
          result: Joi.object().keys(resultPayload).description('Device Result Data.'),
          error: errorPayload,
        },
      },
    },
  },
  {
    // POST /device {  configuration, operation, result, log }
    method: 'POST',
    path: '/',
    handler: addDeviceDataHandler,
    config: {
      description: 'Update Device Data',
      notes: 'Updates latest device configuration, operational and result data in a single request.',
      validate: {
        options: {
          allowUnknown: true,
        },
        payload: Joi.object().keys({
          ...devicePayload,
          includeDeviceConfiguration: Joi.bool()
            .allow(null)
            .optional()
            .description(
              'This flag will determine (When true) if the service is going to respond as part of the response the general configuration of the device'
            ),
          log: Joi.object().allow(null).keys(logPayload).description('Device Log Data'),
          configuration: Joi.object().allow(null).keys(configurationPayload).description('Device Configuration Data'),
          operation: Joi.object().allow(null).keys(operationPayload).description('Device Operation Data'),
          result: Joi.object().allow(null).keys(resultPayload).description('Device Result Data.'),
          getFormsDefinition: Joi.bool()
            .optional()
            .allow(null)
            .description('This is a flag to tell the API if the request source is a daily details POST'),
        }),
        failAction: async (request, h, error) => addDeviceLog(error)(request, h),
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          error: errorPayload,
        },
      },
    },
  },
  {
    // POST /device {  configuration, operation, result, log }
    method: 'POST',
    path: '/fast',
    handler: addDeviceDataFastHandler,
    config: {
      description: 'Update Only Necessary Device Data',
      notes: 'Updates latest device configuration, operational and result data in a single request.',
      validate: {
        options: {
          allowUnknown: true,
        },
        payload: Joi.object().keys({
          ...devicePayload,
          includeDeviceConfiguration: Joi.bool()
            .allow(null)
            .optional()
            .description(
              'This flag will determine (When true) if the service is going to respond as part of the response the general configuration of the device'
            ),
          log: Joi.object().allow(null).keys(logPayload).description('Device Log Data'),
          configuration: Joi.object().allow(null).keys(configurationPayload).description('Device Configuration Data'),
          operation: Joi.object().allow(null).keys(operationPayload).description('Device Operation Data'),
          result: Joi.object().allow(null).keys(resultPayload).description('Device Result Data.'),
          getFormsDefinition: Joi.bool()
            .optional()
            .allow(null)
            .description('This is a flag to tell the API if the request source is a daily details POST'),
        }),
        failAction: async (request, h, error) => addDeviceLog(error)(request, h),
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          error: errorPayload,
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/plugin/{pluginName}',
    handler: addPluginDeviceDataHandler,
    config: {
      description: 'Deliver data in custom plugin format',
      validate: {
        params: {
          pluginName: Joi.string().description('Name of Plugin').required(),
        },
      },
    },
  },
  {
    // POST /device/configuration
    method: 'POST',
    path: '/configuration',
    handler: updateDeviceConfigurationHandler,
    config: {
      description: 'Update Device Configuration',
      notes: 'Device configuration information, such as firmware revision, software versions, serial numbers, etc.',
      validate: {
        payload: {
          ...configurationPayload,
          log: Joi.object().keys(logPayload).description('Device Log Data'),
        },
        failAction: async (request, h, error) => addDeviceLog(error)(request, h),
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          error: errorPayload,
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/operation',
    handler: getDeviceOperationHandler,
    config: {
      notes: 'Get device operational data',
      description: 'Get last updated operation data for the authenticated device given search constraints',

      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          log: Joi.object().keys(logResponse).description('Device Log Data'),
          operation: Joi.object().keys(operationPayload).description('Device Operation Data'),
          error: errorPayload,
        },
      },
    },
  },
  {
    // POST /device/operation
    method: 'POST',
    path: '/operation',
    handler: addDeviceOperationHandler,
    config: {
      description: 'Update Device Operation',
      notes:
        'Devices may deliver operational information to Aspect, such as uptime, communication' +
        ' statistics, status of mechanical systems, calibration information etc. ',
      validate: {
        payload: {
          ...resultPayload,
          log: Joi.object().keys(logPayload).description('Device Log Data'),
        },
        failAction: async (request, h, error) => addDeviceLog(error)(request, h),
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          error: errorPayload,
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/result',
    handler: getResultHandler,
    config: {
      notes: 'Get result data',
      description: 'Get last updated result data for the authenticated device given search constraints',
      validate: {
        query: {
          resultId: Joi.string(),
        },
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          log: Joi.object().keys(logResponse).description('Device Log Data'),
          result: Joi.object().keys(resultPayload).description('Device Result Data.'),
          error: errorPayload,
        },
      },
    },
  },
  {
    // POST /device/result
    method: 'POST',
    path: '/result',
    handler: mergeResultHandler,
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
        payload: {
          ...resultPayload,
          log: Joi.object().keys(logPayload).description('Device Log Data'),
        },
        failAction: async (request, h, error) => addDeviceLog(error)(request, h),
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          error: errorPayload,
        },
      },
    },
  },
  // GET /device/heath-stats
  {
    method: 'GET',
    path: '/health-stats',
    handler: getHealthStatsHandler,
    config: {
      notes: 'Get health stats',
      description: 'It returns a json object with the summary of the device and country operational data',
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          Countries: Joi.array()
            .items(
              Joi.object().keys({
                Country: Joi.string().description('Country name'),
                A2: Joi.string().description('Abbreviation of the country name 2 letters'),
                A3: Joi.string().description('Abbreviation of the country name 3 letters'),
                Date: Joi.date().allow(null).iso().description('Date of the first device connected'),
                Total: Joi.number().allow(null).description('The numbers of devices the country had'),
              })
            )
            .single(true)
            .description('Countries stats'),
          Devices: Joi.array()
            .items(
              Joi.object().keys({
                Country: Joi.string().description('Country name'),
                A2: Joi.string().description('Abbreviation of the country name 2 letters'),
                A3: Joi.string().description('Abbreviation of the country name 3 letters'),
                Date: Joi.date().allow(null).iso().description('Date of the "Total" devices were connected'),
                Total: Joi.number().allow(null).description('The numbers of devices that were connected this month'),
              })
            )
            .single(true)
            .description('Device stats'),
          Tests: Joi.array()
            .items(
              Joi.object().keys({
                Country: Joi.string().description('Country name'),
                A2: Joi.string().description('Abbreviation of the country name 2 letters'),
                A3: Joi.string().description('Abbreviation of the country name 3 letters'),
                Date: Joi.date()
                  .allow(null)
                  .iso()
                  .description('Date of the "Total" test were conducted in this period'),
                Total: Joi.number().allow(null).description('The numbers of devices that were connected this month'),
              })
            )
            .description('Tests stats'),
          Notifications: Joi.array()
            .items(
              Joi.object().keys({
                Country: Joi.string().description('Country name'),
                A2: Joi.string().description('Abbreviation of the country name 2 letters'),
                A3: Joi.string().description('Abbreviation of the country name 3 letters'),
                Date: Joi.date().allow(null).iso().description('Date of the "Total" test were maded in this period'),
                Sms: Joi.number().allow(null).description('The numbers of sms that were sent this period'),
                Email: Joi.number().allow(null).description('The numbers of emails were sent this period'),
                Total: Joi.number().allow(null).description('The sum of Sms and Emails sent in this period'),
              })
            )
            .description('Notifications stats'),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/result/pakistan',
    handler: getResultPakistanHandler,
    config: {
      description: 'Get Tb Stats',
      notes:
        'Returns stats for total TB tests, TB cases and DRTB cases. Accepts last 24hs or from 2022-01-01 start and a especific state or whole country.',
      validate: {
        query: {
          from: Joi.date().iso().required().description('DateTime from, with ISO8601 time offset'),
          to: Joi.date().iso().required().description('DateTime to, with ISO8601 time offset'),
        },
      },
      response: {
        schema: {
          from: Joi.date().iso(),
          to: Joi.date().iso(),
          countryTotals: Joi.object().keys({
            tests: Joi.number(),
            cases: Joi.number(),
            drCases: Joi.number(),
          }),
          stateTotals: Joi.array().items(
            Joi.object().keys({
              stateCode: Joi.string().empty(''),
              state: Joi.string().empty(''),
              tests: Joi.number(),
              cases: Joi.number(),
              drCases: Joi.number(),
            })
          ),
        },
        failAction: 'error',
      },
    },
  },
]

module.exports = { routes }
