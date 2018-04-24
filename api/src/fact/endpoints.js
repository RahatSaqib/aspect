const {
  onFactGenerate,
  onFactGenerateResultCounts,
  onFactGenerateResultCountsForDevice,
  onDeviceSeen,
  onDeviceOnline,
  onDeviceOffline,
  onResultLogged,
} = require('./service')

const subscriptions = [
  {
    actions: {
      FACT_GENERATE: onFactGenerate,
      FACT_GENERATE_RESULT_COUNTS: onFactGenerateResultCounts,
      FACT_GENERATE_RESULT_COUNTS_FOR_DEVICE: onFactGenerateResultCountsForDevice,
      DEVICE_SEEN: onDeviceSeen,
      DEVICE_ONLINE: onDeviceOnline,
      DEVICE_OFFLINE: onDeviceOffline,
      RESULT_LOGGED: onResultLogged,
    },
  },
]

module.exports = { subscriptions }
