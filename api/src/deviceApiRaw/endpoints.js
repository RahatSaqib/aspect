const Promise = require('bluebird')
const { addDeviceRawDataHandler, continueUnprocessedRawData } = require('./service')

const routes = [
  {
    method: 'POST',
    path: '/{params*}',
    handler: addDeviceRawDataHandler,
    config: {
      description: 'For authenticated devices to post any type of payload',
      notes:
        'Using a valid device API key, a device or connector should be able to post any type of data payload to Aspect.',
      validate: {
        options: {
          allowUnknown: true,
        },
      },
    },
  },
]

const subscriptions = [
  {
    actions: {
      DEVICE_RAW_MESSAGE_RESPONSE_READY: {
        purgeOnStart: true,
        shouldHandle: () => false,
        handlerFunction: async () => Promise.resolve(),
      },
      DEVICE_RAW_MESSAGE_POSTED: {
        purgeOnStart: true,
        handlerFunction: async () => Promise.resolve(),
        shouldHandle: () => false,
        allowInfiniteListeners: true,
      },
      DEVICE_RAW_MESSAGE_PROCESSED: {
        purgeOnStart: true,
        shouldHandle: () => false,
        handlerFunction: async () => Promise.resolve(),
      },
      DEVICE_RAW_MESSAGE_ERROR: {
        purgeOnStart: true,
        shouldHandle: () => false,
        handlerFunction: async () => Promise.resolve(),
      },
      DEVICE_CONTINUE_UNPROCESSED_RAW_DATA: continueUnprocessedRawData,
    },
  },
]

module.exports = { routes, subscriptions }
