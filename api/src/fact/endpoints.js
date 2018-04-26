const {
  onFactGenerate,
  onDeviceSeen,
  onDeviceUpdateFlag,
  onResultLogged,
} = require('./service')

const subscriptions = [
  {
    actions: {
      FACT_GENERATE: onFactGenerate,
      DEVICE_SEEN: onDeviceSeen,
      DEVICE_ONLINE: onDeviceUpdateFlag({ offline: 0 }),
      DEVICE_OFFLINE: onDeviceUpdateFlag({ offline: 1 }),
      DEVICE_NO_RESULTS: onDeviceUpdateFlag({ noResults: 1 }),
      RESULT_LOGGED: onResultLogged,
    },
  },
]

module.exports = { subscriptions }
