const {
  onEmailMessageCreated,
  onEmailMessageReadyForSending,
} = require('./service')

const subscriptions = [
  {
    actions: {
      EMAIL_MESSAGE_CREATED: onEmailMessageCreated,
      EMAIL_MESSAGE_READY_FOR_SENDING: onEmailMessageReadyForSending,
    },
  },
]

module.exports = { subscriptions }
