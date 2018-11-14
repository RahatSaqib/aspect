// ----------- Action Types ---------------------
const types = {
  EMAIL_MESSAGE_CREATED: 'EMAIL_MESSAGE_CREATED',
  EMAIL_MESSAGE_READY_FOR_SENDING: 'EMAIL_MESSAGE_READY_FOR_SENDING',
  EMAIL_MESSAGE_SENT: 'EMAIL_MESSAGE_SENT',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the email message
 * has been created with the given id
 *
 * emailMessageId is required.
 */
function emailMessageCreated(emailMessageId) {
  if (!emailMessageId) {
    throw new Error('Must specify emailMessageId')
  }
  return {
    type: types.EMAIL_MESSAGE_CREATED,
    emailMessageId,
  }
}

/**
 * Creates an action to notify MQ the email message
 * has been pre-processed, it's template has been merged with actual data
 * and message is ready for further processing by SendGrid
 *
 * emailMessageId is required.
 */
function emailMessageReadyForSending(emailMessageId) {
  if (!emailMessageId) {
    throw new Error('Must specify emailMessageId')
  }
  return {
    type: types.EMAIL_MESSAGE_READY_FOR_SENDING,
    emailMessageId,
  }
}

/**
 * Creates an action to notify MQ the email message
 * has been sent
 *
 * emailMessageId is required.
 */
function emailMessageSent(emailMessageId) {
  if (!emailMessageId) {
    throw new Error('Must specify emailMessageId')
  }
  return {
    type: types.EMAIL_MESSAGE_SENT,
    emailMessageId,
  }
}

module.exports = {
  types,
  emailMessageCreated,
  emailMessageReadyForSending,
  emailMessageSent,
}
