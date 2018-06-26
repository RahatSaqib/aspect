const { onWebhookTrigger, onWebhookMessageCreated } = require('./service')

const subscriptions = [
  {
    actions: {
      WEBHOOK_TRIGGER: onWebhookTrigger,
      WEBHOOK_MESSAGE_CREATED: onWebhookMessageCreated,
    },
  },
]

module.exports = { subscriptions }
