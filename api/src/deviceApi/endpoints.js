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
  addPluginDeviceDataHandler,
  addDeviceOperationHandler,
  updateDeviceConfigurationHandler,
  mergeResultHandler,
  getHealthStatsHandler,
  getResultPakistanHandler,
} = require('./service')

const {
  logResponse,
  logPayload,
  devicePayload,
  configurationPayload,
  operationPayload,
  resultPayload,
  errorPayload,
  testAggResponseValidation,
  testAggRequestQueryValidation,
  devicePayloadValidation,
} = require('./validation')
const { getTestAggregate } = require('./mozambique/zenysisApiClient')
const { addDeviceLog } = require('./deviceApiHandler')
const { devicePayloadHandler } = require('./devicePayloadHandler')

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
    handler: devicePayloadHandler,
    config: {
      description: 'Update Device Data',
      notes: 'Updates latest device configuration, operational and result data in a single request.',
      validate: {
        options: {
          allowUnknown: true,
        },
        payload: devicePayloadValidation,
        failAction: async (request, h, error) => addDeviceLog(error)(request, h),
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          error: errorPayload,
        },
        status: {
          201: {},
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
  {
    // Result aggregate Pull API for Zenysis
    method: 'GET',
    path: '/zenysis-sis/test-results',
    handler: getTestAggregate,
    config: {
      description: 'Get Test Results Aggregate',
      notes: 'Get test results aggregate for each site',
      validate: {
        query: testAggRequestQueryValidation(),
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: testAggResponseValidation(),
      },
    },
  },
]

module.exports = { routes }
