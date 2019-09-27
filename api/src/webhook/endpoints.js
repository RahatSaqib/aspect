const {
  onWebhookMessageCreated,
  onWebhookMessagePending,
  onWebhookMessageSent,
} = require('./service')

const subscriptions = [
  {
    actions: {
      WEBHOOK_MESSAGE_CREATED: onWebhookMessageCreated,
      WEBHOOK_MESSAGE_PENDING: onWebhookMessagePending,
      WEBHOOK_MESSAGE_SENT: onWebhookMessageSent,
    },
  },
]

module.exports = { subscriptions }
