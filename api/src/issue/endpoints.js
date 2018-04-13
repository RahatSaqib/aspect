const { onIssueEventTrigger, onIssueEventResolve } = require('./service')

const subscriptions = [
  {
    actions: {
      DEVICE_OFFLINE: onIssueEventTrigger('DeviceOffline'),
      DEVICE_ONLINE: onIssueEventResolve('DeviceOffline'),
      DEVICE_MODULE_ERROR: onIssueEventTrigger('ModuleError'),
    },
  },
]

module.exports = { subscriptions }
