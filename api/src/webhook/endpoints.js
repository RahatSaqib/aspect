const {
  onWebhookMessageCreated,
  onWebhookMessagePending,
} = require('./service')

const subscriptions = [
  {
    actions: {
      WEBHOOK_MESSAGE_CREATED: onWebhookMessageCreated,
      WEBHOOK_MESSAGE_PENDING: onWebhookMessagePending,
    },
  },
]

module.exports = { subscriptions }
