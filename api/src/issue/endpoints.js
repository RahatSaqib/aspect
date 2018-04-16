const { onIssueEventTrigger, onIssueEventResolve } = require('./service')

const subscriptions = [
  {
    actions: {
      DEVICE_OFFLINE: onIssueEventTrigger('DeviceOffline'),
      DEVICE_ONLINE: onIssueEventResolve('DeviceOffline'),
      RESULT_MODULE_ERROR: onIssueEventTrigger('DeviceModuleError'),
    },
  },
]

module.exports = { subscriptions }
