// ----------- Action Types ---------------------
const types = {
  WEBHOOK_MESSAGE_CREATED: 'WEBHOOK_MESSAGE_CREATED',
}

// ----------- Action Creators -------------------

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

module.exports = {
  types,
  webhookMessageCreated,
}
