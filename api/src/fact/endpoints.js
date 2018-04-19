const {
  onFactGenerateResultCounts,
  onFactGenerateResultCountsForDevice,
  onFactGenerateDeviceOffline,
  onDeviceSeen,
  onDeviceOnline,
  onDeviceOffline,
  onResultLogged,
} = require('./service')

const subscriptions = [
  {
    actions: {
      FACT_GENERATE_RESULT_COUNTS: onFactGenerateResultCounts,
      FACT_GENERATE_RESULT_COUNTS_FOR_DEVICE: onFactGenerateResultCountsForDevice,
      FACT_GENERATE_DEVICE_OFFLINE: onFactGenerateDeviceOffline,
      DEVICE_SEEN: onDeviceSeen,
      DEVICE_ONLINE: onDeviceOnline,
      DEVICE_OFFLINE: onDeviceOffline,
      RESULT_LOGGED: onResultLogged,
    },
  },
]

module.exports = { subscriptions }
