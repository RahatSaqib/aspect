const { resolveDevice, lookupDeviceByApiKey } = require('./deviceIdentification')
const { withPayload, addDeviceLogUpdate, notifyResultUpdated } = require('./contextHelpers')

module.exports = {
  resolveDevice,
  lookupDeviceByApiKey,
  withPayload,
  addDeviceLogUpdate,
  notifyResultUpdated,
}
