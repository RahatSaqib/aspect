const _ = require('lodash')
const Boom = require('boom')
const { macAddressValid } = require('./requestValidation')

async function preProcessUpdateDeviceConfiguration({ payload }) {
  const macAddress = _.get(payload, 'data.macAddress')
  if (macAddress && !macAddressValid(macAddress)) {
    throw Boom.badRequest(`Invalid MAC address in request: '${macAddress}'`)
  }
}

module.exports = preProcessUpdateDeviceConfiguration
