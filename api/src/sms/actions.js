// ----------- Action Types ---------------------
const types = {
  SMS_MESSAGE_CREATED: 'SMS_MESSAGE_CREATED',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the sms message
 * has been created with the given id
 *
 * smsMessageId is required.
 */
function smsMessageCreated(smsMessageId) {
  if (smsMessageId == null) {
    throw new Error('Must specify smsMessageId')
  }
  return {
    type: types.SMS_MESSAGE_CREATED,
    smsMessageId,
  }
}

module.exports = {
  types,
  smsMessageCreated,
}
