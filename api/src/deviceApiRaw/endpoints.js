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
      DEVICE_RAW_MESSAGE_RESPONSE_READY: async () => Promise.resolve(),
      DEVICE_RAW_MESSAGE_POSTED: {
        handlerFunction: async () => Promise.resolve(),
        shouldHandle: () => false,
        allowInfiniteListeners: true,
      },
      DEVICE_RAW_MESSAGE_PROCESSED: async () => Promise.resolve(),
      DEVICE_RAW_MESSAGE_ERROR: async () => Promise.resolve(),
    },
  },
]

module.exports = { routes, subscriptions }
