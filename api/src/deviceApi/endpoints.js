// All Device API endpoints in this file are relative to /device/ and
// require Device Token authentication.
const {
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
