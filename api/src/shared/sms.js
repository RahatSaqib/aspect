const twilio = require('twilio')
const config = require('../config')

function sendSms(cellNumber, message) {
  const smsCfg = config.sms

  if (smsCfg.useTwilio === true) {
    // These consts are your settings from https://www.twilio.com/console
    const {
      accountSid,
      authToken,
      fromNumber,
      messagingServiceSid,
    } = smsCfg.twilio
    const client = twilio(accountSid, authToken)

    // send sms
    client.messages
      .create({
        messagingServiceSid,
        from: fromNumber,
        to: cellNumber,
        body: message,
      })
      .then(response => {
        console.log(response)
      })
  }
}

module.exports = {
  sendSms,
}
