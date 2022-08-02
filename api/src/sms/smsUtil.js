const fetch = require('node-fetch')
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
  logger.info('Sending sms by ADN provider')
  const params = new URLSearchParams()
  params.append('api_key', api_key)
  params.append('api_secret', api_secret)
  params.append('request_type', 'SINGLE_SMS')
  params.append('mobile', cellNumber)
  params.append('message_body', message)
  try {
    const response = await fetch(url, { method: 'POST', body: params })
    const data = await response.json()
    if (data.api_response_code !== 200)
      throw new Error(`sending sms throw adn api throw an error ${data.error.error_message}`)
    else return data
  } catch (err) {
    logger.error(err)
  }

  return null
  // send sms - see https://www.twilio.com/docs/api/messaging/send-messages-copilot#sending-messages-with-copilot
}

async function sendSmsTwilio(cellNumber, message, twilioConf) {
  // These consts are your settings from https://www.twilio.com/console
  const { accountSid, authToken, fromNumber, messagingServiceSid } = twilioConf
  let clientCreated = null
  logger.info('Sending sms by Twilio provider')
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
