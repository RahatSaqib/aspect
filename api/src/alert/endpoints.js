const { onAlertMessageCreated } = require('./service')

const subscriptions = [
  {
    actions: {
      ALERT_MESSAGE_CREATED: onAlertMessageCreated,
    },
  },
]

module.exports = { subscriptions }
