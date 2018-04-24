const { onIssueEventTrigger, onIssueEventResolve } = require('./service')

const subscriptions = [
  {
    actions: {
      DEVICE_OFFLINE: onIssueEventTrigger('DeviceOffline'),
      DEVICE_ONLINE: onIssueEventResolve('DeviceOffline'),
      DEVICE_NO_RESULTS: onIssueEventTrigger('DeviceNoResults'),
    },
  },
]

module.exports = { subscriptions }
