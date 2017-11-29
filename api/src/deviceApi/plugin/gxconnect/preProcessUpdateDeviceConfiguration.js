const _ = require('lodash')
const Boom = require('boom')
const { macAddressValid } = require('./requestValidation')

function* preProcessUpdateDeviceConfiguration(context) {
  const macAddress = _.get(context.payload, 'data.macAddress')
  if (!macAddressValid(macAddress)) {
    throw Boom.badRequest(`Invalid MAC address in request: '${macAddress}'`)
  }
}

module.exports = preProcessUpdateDeviceConfiguration
