// ----------- Action Types ---------------------
const types = {
  SMS_MESSAGE_CREATED: 'SMS_MESSAGE_CREATED',
  SMS_MESSAGE_READY_FOR_SENDING: 'SMS_MESSAGE_READY_FOR_SENDING',
  SMS_MESSAGE_SENT: 'SMS_MESSAGE_SENT',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the sms message
 * has been created with the given id
 *
 * smsMessageId is required.
 */
function smsMessageCreated(smsMessageId) {
  if (!smsMessageId) {
    throw new Error('Must specify smsMessageId')
  }
  return {
    type: types.SMS_MESSAGE_CREATED,
    smsMessageId,
  }
}

/**
 * Creates an action to notify MQ the sms message
 * has been pre-processed, it's template has been merged with actual data
 * and message is ready for further processing by Sms Provider (i.e. Twilio)
 *
 * smsMessageId is required.
 */
function smsMessageReadyForSending(smsMessageId) {
  if (!smsMessageId) {
    throw new Error('Must specify smsMessageId')
  }
  return {
    type: types.SMS_MESSAGE_READY_FOR_SENDING,
    smsMessageId,
  }
}

/**
 * Creates an action to notify MQ the sms message
 * has been sent
 *
 * smsMessageId is required.
 */
function smsMessageSent(smsMessageId) {
  if (!smsMessageId) {
    throw new Error('Must specify smsMessageId')
  }
  return {
    type: types.SMS_MESSAGE_SENT,
    smsMessageId,
  }
}

module.exports = {
  types,
  smsMessageCreated,
  smsMessageReadyForSending,
  smsMessageSent,
}
