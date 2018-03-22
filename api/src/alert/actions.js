// ----------- Action Types ---------------------
const types = {
  ALERT_MESSAGE_CREATED: 'ALERT_MESSAGE_CREATED',
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

module.exports = {
  types,
  alertMessageCreated,
}
