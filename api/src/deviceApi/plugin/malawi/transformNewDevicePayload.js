const DEVICE_TYPE_CHAI = 'CHAILIMS'
const DEVICE_TYPE_REPORTER = 'AspectReporter'

const { get } = require('lodash')

async function transformNewDevicePayload({ payload }) {
  const deviceType = get(payload, 'type.id', null)
  if (deviceType === null) {
    return payload
  }
  // map external Ids from "legacy" devices
  if (deviceType === 'RRT') {
    payload.type.id = DEVICE_TYPE_REPORTER
  }
  if (deviceType === 'CHAI') {
    payload.type.id = DEVICE_TYPE_CHAI
  }
  return payload
}

module.exports = transformNewDevicePayload
