const _ = require('lodash')
const twilio = require('twilio')
const config = require('../config')

async function sendSms(cellNumber, message) {
  cellNumber = _.isNil(cellNumber) ? config.throwAway.sms : cellNumber

  // These consts are your settings from https://www.twilio.com/console
  const {
    accountSid,
    authToken,
    fromNumber,
    messagingServiceSid,
  } = config.sms.twilio
  const client = twilio(accountSid, authToken)

  // send sms - see https://www.twilio.com/docs/api/messaging/send-messages-copilot#sending-messages-with-copilot
  return client.messages.create({
    messagingServiceSid,
    from: fromNumber,
    to: cellNumber,
    body: message,
  })
}

module.exports = {
  sendSms,
}
