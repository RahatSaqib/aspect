const twilio = require('twilio')
const config = require('../config')
const logger = require('../shared/logger')

async function sendSms(cellNumber, message) {
  // These consts are your settings from https://www.twilio.com/console
  const { accountSid, authToken, fromNumber, messagingServiceSid } =
    config.sms.twilio
  let clientCreated = null
  try {
    const client = twilio(accountSid, authToken)

    // send sms - see https://www.twilio.com/docs/api/messaging/send-messages-copilot#sending-messages-with-copilot
    clientCreated = client.messages.create({
      messagingServiceSid,
      from: fromNumber,
      to: cellNumber,
      body: message,
    })
  } catch (e) {
    logger.error(e)
  }
  return clientCreated
}

module.exports = {
  sendSms,
}
