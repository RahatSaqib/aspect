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

module.exports = { routes }
