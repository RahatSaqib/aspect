const { resolveDeviceContext, getHandlerOptionsFromRequest } = require('./resolveDeviceContext')
const { resolveDevice, lookupDeviceByApiKey } = require('./deviceIdentification')
const { createNewDevice } = require('./deviceCreation')
const { sendNotificationToContacts, notifyPerson } = require('./deviceNotifications')
const { withPayload, addDeviceLogUpdate, notifyResultUpdated } = require('./contextHelpers')

module.exports = {
  resolveDeviceContext,
  getHandlerOptionsFromRequest,
  resolveDevice,
  lookupDeviceByApiKey,
  createNewDevice,
  sendNotificationToContacts,
  notifyPerson,
  withPayload,
  addDeviceLogUpdate,
  notifyResultUpdated,
}
