const {
  onFactGenerateResultCounts,
  onFactGenerateDeviceOffline,
  onDeviceSeen,
  onDeviceOnline,
  onDeviceOffline,
} = require('./service')

const subscriptions = [
  {
    actions: {
      FACT_GENERATE_RESULT_COUNTS: onFactGenerateResultCounts,
      FACT_GENERATE_DEVICE_OFFLINE: onFactGenerateDeviceOffline,
      DEVICE_SEEN: onDeviceSeen,
      DEVICE_ONLINE: onDeviceOnline,
      DEVICE_OFFLINE: onDeviceOffline,
    },
  },
]

module.exports = { subscriptions }
