// ----------- Action Types ---------------------
const types = {
  EMAIL_MESSAGE_CREATED: 'EMAIL_MESSAGE_CREATED',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the email message
 * has been created with the given id
 *
 * emailMessageId is required.
 */
function emailMessageCreated(emailMessageId) {
  if (emailMessageId == null) {
    throw new Error('Must specify emailMessageId')
  }
  return {
    type: types.EMAIL_MESSAGE_CREATED,
    emailMessageId,
  }
}

module.exports = {
  types,
  emailMessageCreated,
}
