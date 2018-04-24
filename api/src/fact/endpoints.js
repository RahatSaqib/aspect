const {
  onFactGenerate,
  onDeviceSeen,
  onDeviceOnline,
  onDeviceOffline,
  onResultLogged,
} = require('./service')

const subscriptions = [
  {
    actions: {
      FACT_GENERATE: onFactGenerate,
      DEVICE_SEEN: onDeviceSeen,
      DEVICE_ONLINE: onDeviceOnline,
      DEVICE_OFFLINE: onDeviceOffline,
      RESULT_LOGGED: onResultLogged,
    },
  },
]

module.exports = { subscriptions }
