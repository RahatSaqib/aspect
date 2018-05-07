const {
  onSmsMessageCreated,
  onSmsMessageReadyForSending,
} = require('./service')

const subscriptions = [
  {
    actions: {
      SMS_MESSAGE_CREATED: onSmsMessageCreated,
      SMS_MESSAGE_READY_FOR_SENDING: onSmsMessageReadyForSending,
    },
  },
]

module.exports = { subscriptions }
