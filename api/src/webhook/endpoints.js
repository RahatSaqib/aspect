const {
  onWebhookMessageCreated,
  onWebhookMessagePending,
  onWebhookMessageSent,
  onWebhookMessageError,
} = require('./service')

const subscriptions = [
  {
    actions: {
      WEBHOOK_MESSAGE_CREATED: onWebhookMessageCreated,
      WEBHOOK_MESSAGE_PENDING: onWebhookMessagePending,
      WEBHOOK_MESSAGE_SENT: onWebhookMessageSent,
      WEBHOOK_MESSAGE_ERROR: onWebhookMessageError,
    },
  },
]

module.exports = { subscriptions }
