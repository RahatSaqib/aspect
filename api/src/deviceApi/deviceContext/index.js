const { resolveDevice, lookupDeviceByApiKey } = require('./deviceIdentification')
const { createNewDevice } = require('./deviceCreation')
const { sendNotificationToContacts, notifyPerson } = require('./deviceNotifications')
const { withPayload, addDeviceLogUpdate, notifyResultUpdated } = require('./contextHelpers')

module.exports = {
  resolveDevice,
  lookupDeviceByApiKey,
  createNewDevice,
  sendNotificationToContacts,
  notifyPerson,
  withPayload,
  addDeviceLogUpdate,
  notifyResultUpdated,
}
