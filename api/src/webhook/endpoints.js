const {
  onWebhookMessageCreated,
  onWebhookMessagePending,
  onWebhookMessageSent,
  onWebhookMessageError,
  onWebHookServerCheckTokens,
  onPostResultToWebHookServers,
} = require('./service')

const subscriptions = [
  {
    actions: {
      WEBHOOK_MESSAGE_CREATED: onWebhookMessageCreated,
      WEBHOOK_MESSAGE_PENDING: onWebhookMessagePending,
      WEBHOOK_MESSAGE_SENT: onWebhookMessageSent,
      WEBHOOK_MESSAGE_ERROR: onWebhookMessageError,

      WEBHOOK_SERVER_CHECK_TOKENS: onWebHookServerCheckTokens,
      POST_RESULT_TO_WEBHOOK_SERVERS: onPostResultToWebHookServers,
    },
  },
]

module.exports = { subscriptions }
