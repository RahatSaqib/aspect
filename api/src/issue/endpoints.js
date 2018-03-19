const { onIssueTriggered, onIssueResolved } = require('./service')

const subscriptions = [
  {
    actions: {
      DEVICE_OFFLINE: onIssueTriggered('DeviceOffline'),
      DEVICE_ONLINE: onIssueResolved('DeviceOffline'),
    },
  },
]

module.exports = { subscriptions }
