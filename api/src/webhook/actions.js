// ----------- Action Types ---------------------
const types = {
  WEBHOOK_MESSAGE_CREATED: 'WEBHOOK_MESSAGE_CREATED',
  WEBHOOK_MESSAGE_PENDING: 'WEBHOOK_MESSAGE_PENDING',
  WEBHOOK_MESSAGE_SENT: 'WEBHOOK_MESSAGE_SENT',
  WEBHOOK_MESSAGE_ERROR: 'WEBHOOK_MESSAGE_ERROR',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the webhook message
 * has been created with the given id
 *
 * webhookMessageId is required.
 */
function webhookMessageCreated(webhookMessageId) {
  if (!webhookMessageId) {
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
  if (!webhookMessageId) {
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

/**
 * Creates an action to notify MQ there was an error
 * trying to send the webook message
 *
 * webhookMessageId is required.
 */
function webhookMessageError(webhookMessageId) {
  if (!webhookMessageId) {
    throw new Error('Must specify webhookMessageId')
  }
  return {
    type: types.WEBHOOK_MESSAGE_ERROR,
    webhookMessageId,
  }
}

module.exports = {
  types,
  webhookMessageCreated,
  webhookMessagePending,
  webhookMessageSent,
  webhookMessageError,
}
