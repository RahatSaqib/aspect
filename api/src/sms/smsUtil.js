const { createFetch, base, method, params, parse } = require('http-client')
const twilio = require('twilio')
const config = require('../config')
const logger = require('../shared/logger')

async function sendSms(cellNumber, message) {
  const { adn, twilio: twilioConf } = config.sms
  if (adn.api_key) return sendSmsAdn(cellNumber, message, adn)
  return sendSmsTwilio(cellNumber, message, twilioConf)
}

async function sendSmsAdn(cellNumber, message, adn) {
  // eslint-disable-next-line camelcase
  const { api_key, api_secret, url } = adn
  let resp = null
  try {
    const adnFetch = createFetch(
      method('POST'),
      base(url),
      params(
        JSON.stringify({
          api_key,
          api_secret,
          request_type: 'SINGLE_SMS',
          message_type: 'TEXT',
          mobile: cellNumber,
          message_body: message,
        })
      ),
      parse('json')
    )
    try {
      resp = await adnFetch('/secure/send-sms')
    } catch (err) {
      logger.error(err)
    }

    if (resp.response !== 200) {
      throw new Error(`Error for sending sms${resp.body}`)
    }
    return resp.json()

    // send sms - see https://www.twilio.com/docs/api/messaging/send-messages-copilot#sending-messages-with-copilot
  } catch (e) {
    logger.error(e)
  }
}

async function sendSmsTwilio(cellNumber, message, twilioConf) {
  // These consts are your settings from https://www.twilio.com/console
  const { accountSid, authToken, fromNumber, messagingServiceSid } = twilioConf
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
