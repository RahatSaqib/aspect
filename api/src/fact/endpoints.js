const {
  onFactGenerateResultCounts,
  onFactGenerateDeviceOffline,
  onDeviceOnline,
  onDeviceOffline,
} = require('./service')

const subscriptions = [
  {
    actions: {
      FACT_GENERATE_RESULT_COUNTS: onFactGenerateResultCounts,
      FACT_GENERATE_DEVICE_OFFLINE: onFactGenerateDeviceOffline,
      DEVICE_ONLINE: onDeviceOnline,
      DEVICE_OFFLINE: onDeviceOffline,
    },
  },
]

module.exports = { subscriptions }
