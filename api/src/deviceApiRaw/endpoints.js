const {
  addDeviceRawDataHandler,
  onDeviceRawMessagePosted,
  onDeviceRawMessageProcessed,
  onDeviceRawMessageError,
} = require('./service')

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
      DEVICE_RAW_MESSAGE_POSTED: onDeviceRawMessagePosted,
      DEVICE_RAW_MESSAGE_PROCESSED: onDeviceRawMessageProcessed,
      DEVICE_RAW_MESSAGE_ERROR: onDeviceRawMessageError,
    },
  },
]

module.exports = { routes, subscriptions }
