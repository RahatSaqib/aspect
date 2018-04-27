const { onIssueEventTrigger, onIssueEventResolve } = require('./service')

const subscriptions = [
  {
    actions: {
      DEVICE_OFFLINE: onIssueEventTrigger('DeviceOffline'),
      DEVICE_ONLINE: onIssueEventResolve('DeviceOffline'),
      DEVICE_NO_RESULTS: onIssueEventTrigger('DeviceNoResults'),
      DEVICE_HAS_NEW_RESULTS: onIssueEventResolve('DeviceNoResults'),
    },
  },
]

module.exports = { subscriptions }
