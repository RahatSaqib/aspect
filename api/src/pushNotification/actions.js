// ----------- Action Types ---------------------
const types = {
  PUSH_NOTIFICATION_MESSAGE_CREATED: 'PUSH_NOTIFICATION_MESSAGE_CREATED',
  PUSH_NOTIFICATION_MESSAGE_READY_FOR_SENDING: 'PUSH_NOTIFICATION_MESSAGE_READY_FOR_SENDING',
  PUSH_NOTIFICATION_MESSAGE_SENT: 'PUSH_NOTIFICATION_MESSAGE_SENT',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the push notification message
 * has been created with the given id
 *
 * pushNotificationMessageId is required.
 */
function pushNotificationMessageCreated(pushNotificationMessageId) {
  if (!pushNotificationMessageId) {
    throw new Error('Must specify pushNotificationMessageId')
  }
  return {
    type: types.PUSH_NOTIFICATION_MESSAGE_CREATED,
    pushNotificationMessageId,
  }
}

/**
 * Creates an action to notify MQ the push notification message
 * has been pre-processed, it's template has been merged with actual data
 * and message is ready for further processing by push notification provider (Firebase, etc.)
 *
 * pushNotificationMessageId is required.
 */
function pushNotificationMessageReadyForSending(pushNotificationMessageId) {
  if (!pushNotificationMessageId) {
    throw new Error('Must specify pushNotificationMessageId')
  }
  return {
    type: types.PUSH_NOTIFICATION_MESSAGE_READY_FOR_SENDING,
    pushNotificationMessageId,
  }
}

/**
 * Creates an action to notify MQ the push notification message
 * has been sent
 *
 * pushNotificationMessageId is required.
 */
function pushNotificationMessageSent(pushNotificationMessageId) {
  if (!pushNotificationMessageId) {
    throw new Error('Must specify pushNotificationMessageId')
  }
  return {
    type: types.PUSH_NOTIFICATION_MESSAGE_SENT,
    pushNotificationMessageId,
  }
}

module.exports = {
  types,
  pushNotificationMessageCreated,
  pushNotificationMessageReadyForSending,
  pushNotificationMessageSent,
}
