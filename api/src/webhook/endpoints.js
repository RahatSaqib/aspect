const {
  onWebhookTrigger,
  onWebhookMessageCreated,
  onWebhookMessagePending,
} = require('./service')

const subscriptions = [
  {
    actions: {
      WEBHOOK_TRIGGER: onWebhookTrigger,
      WEBHOOK_MESSAGE_CREATED: onWebhookMessageCreated,
      WEBHOOK_MESSAGE_PENDING: onWebhookMessagePending,
    },
  },
]

module.exports = { subscriptions }
