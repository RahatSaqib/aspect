const Promise = require('bluebird')
const { addDeviceRawDataHandler } = require('./service')

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
        handlerFunction: async () => Promise.resolve(),
      },
      DEVICE_RAW_MESSAGE_ERROR: {
        purgeOnStart: true,
        handlerFunction: async () => Promise.resolve(),
      },
    },
  },
]

module.exports = { routes, subscriptions }
