const {
  onFactGenerateResultCounts,
  onFactGenerateDeviceOffline,
} = require('./service')

const subscriptions = [
  {
    name: 'fact',
    durable: true,
    actions: {
      FACT_GENERATE_RESULT_COUNTS: onFactGenerateResultCounts,
      FACT_GENERATE_DEVICE_OFFLINE: onFactGenerateDeviceOffline,
    },
  },
]

module.exports = { subscriptions }
