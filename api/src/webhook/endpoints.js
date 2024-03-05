const {
  onWebhookMessageCreated,
  onWebhookMessagePending,
  onWebhookMessageSent,
  onWebhookMessageError,
  onWebHookServerCheckTokens,
} = require('./service')

const subscriptions = [
  {
    actions: {
      WEBHOOK_MESSAGE_CREATED: onWebhookMessageCreated,
      WEBHOOK_MESSAGE_PENDING: onWebhookMessagePending,
      WEBHOOK_MESSAGE_SENT: onWebhookMessageSent,
      WEBHOOK_MESSAGE_ERROR: onWebhookMessageError,

      WEBHOOK_SERVER_CHECK_TOKENS: onWebHookServerCheckTokens,
    },
  },
]

module.exports = { subscriptions }
