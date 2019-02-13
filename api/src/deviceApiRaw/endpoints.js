const { addDeviceRawDataHandler } = require('./service')

const routes = [
  {
    method: 'POST',
    path: '/',
    handler: addDeviceRawDataHandler,
    config: {
      description: 'For authenticated devices to post any type of payload',
      notes:
        'Using a valid device API key, a device or connector should be able to post any type of data payload to Aspect.',
    },
  },
]

module.exports = { routes }
