const {
  onFactGenerateDeviceConnectivity,
  onFactGenerateResultCounts,
  onDeviceUpdateFlag,
  onResultLogged,
} = require('./service')

const subscriptions = [
  {
    actions: {
      FACT_GENERATE_DEVICE_CONNECTIVITY: onFactGenerateDeviceConnectivity,
      FACT_GENERATE_RESULT_COUNTS: onFactGenerateResultCounts,
      DEVICE_ONLINE: onDeviceUpdateFlag({ offline: 0 }),
      DEVICE_OFFLINE: onDeviceUpdateFlag({ offline: 1 }),
      DEVICE_HAS_NEW_RESULTS: onDeviceUpdateFlag({ noResults: 0 }),
      DEVICE_NO_RESULTS: onDeviceUpdateFlag({ noResults: 1 }),
      RESULT_LOGGED: onResultLogged,
    },
  },
]

module.exports = { subscriptions }
