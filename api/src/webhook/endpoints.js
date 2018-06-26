const { onWebhookMessageCreated } = require('./service')

const subscriptions = [
  {
    actions: {
      WEBHOOK_MESSAGE_CREATED: onWebhookMessageCreated,
    },
  },
]

module.exports = { subscriptions }
