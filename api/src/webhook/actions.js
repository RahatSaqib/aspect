// ----------- Action Types ---------------------
const types = {
  WEBHOOK_TRIGGER: 'WEBHOOK_TRIGGER',
  WEBHOOK_MESSAGE_CREATED: 'WEBHOOK_MESSAGE_CREATED',
  WEBHOOK_MESSAGE_PENDING: 'WEBHOOK_MESSAGE_PENDING',
  WEBHOOK_MESSAGE_SENT: 'WEBHOOK_MESSAGE_SENT',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to invoke a webhook
 *
 * webhookTemplateExternalId is required.
 * options:
 *   personId
 *   siteId
 *   deviceId
 *   resultId
 */
function webhookTrigger(webhookTemplateExternalId, options) {
  if (webhookTemplateExternalId == null) {
    throw new Error('Must specify webhookTemplateExternalId')
  }
  return {
    type: types.WEBHOOK_TRIGGER,
    webhookTemplateExternalId,
    options,
  }
}

/**
 * Creates an action to notify the webhook message
 * has been created with the given id
 *
 * webhookMessageId is required.
 */
function webhookMessageCreated(webhookMessageId) {
  if (webhookMessageId == null) {
    throw new Error('Must specify webhookMessageId')
  }
  return {
    type: types.WEBHOOK_MESSAGE_CREATED,
    webhookMessageId,
  }
}

/**
 * Creates an action to notify the webhook message
 * is populated and pending web action (post/get)
 *
 * webhookMessageId is required.
 */
function webhookMessagePending(webhookMessageId) {
  if (webhookMessageId == null) {
    throw new Error('Must specify webhookMessageId')
  }
  return {
    type: types.WEBHOOK_MESSAGE_PENDING,
    webhookMessageId,
  }
}

/**
 * Creates an action to notify MQ the webook message
 * has been sent
 *
 * webhookMessageId is required.
 */
function webhookMessageSent(webhookMessageId) {
  if (!webhookMessageId) {
    throw new Error('Must specify webhookMessageId')
  }
  return {
    type: types.WEBHOOK_MESSAGE_SENT,
    webhookMessageId,
  }
}

module.exports = {
  types,
  webhookTrigger,
  webhookMessageCreated,
  webhookMessagePending,
  webhookMessageSent,
}
