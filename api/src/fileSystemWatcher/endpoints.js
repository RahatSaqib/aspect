const { onNewFileDetected } = require('./service')

const subscriptions = [
  {
    actions: {
      NEW_FILE_DETECTED: onNewFileDetected,
    },
  },
]

module.exports = { subscriptions }
