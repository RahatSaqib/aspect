// ----------- Action Types ---------------------
const types = {
  ALERT_MESSAGE_CREATED: 'ALERT_MESSAGE_CREATED',
  ALERT_MESSAGE_SENT: 'ALERT_MESSAGE_SENT',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the alert message
 * has been created with the given id
 *
 * alertMessageId is required.
 */
function alertMessageCreated(alertMessageId) {
  if (alertMessageId == null) {
    throw new Error('Must specify alertMessageId')
  }
  return {
    type: types.ALERT_MESSAGE_CREATED,
    alertMessageId,
  }
}

/**
 * Creates an action to notify MQ the email message
 * has been sent
 *
 * emailMessageId is required.
 */
function alertMessageSent(alertMessageId) {
  if (!alertMessageId) {
    throw new Error('Must specify alertMessageId')
  }
  return {
    type: types.ALERT_MESSAGE_SENT,
    alertMessageId,
  }
}

module.exports = {
  types,
  alertMessageCreated,
  alertMessageSent,
}
