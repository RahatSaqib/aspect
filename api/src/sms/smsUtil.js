const fetch = require('node-fetch')
const twilio = require('twilio')
const config = require('../config')
const logger = require('../shared/logger')

async function sendSms(cellNumber, message) {
  const { adn: adnConf, twilio: twilioConf, termii: termiiConf } = config.sms
  if (termiiConf.api_key) {
    return sendSmsTermii(cellNumber, message, termiiConf)
  }
  if (adnConf.api_key) {
    return sendSmsAdn(cellNumber, message, adnConf)
  }
  return sendSmsTwilio(cellNumber, message, twilioConf)
}

async function sendSmsAdn(cellNumber, message, adnConf) {
  // eslint-disable-next-line camelcase
  const { api_key, api_secret, url } = adnConf
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
    throw e
  }
  return clientCreated
}

async function sendSmsTermii(cellNumber, message, termiiConf) {
  const data = {
    to: cellNumber,
    from: termiiConf.from,
    sms: message,
    type: 'plain',
    api_key: termiiConf.api_key,
    channel: termiiConf.channel,
  }

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }

  try {
    const response = await fetch(termiiConf.url, options)
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`sending sms throw termii api throw an error: ${body}`)
    }
    const data = await response.json()
    return data
  } catch (err) {
    logger.error(err)
  }

  return null
}

module.exports = {
  sendSms,
}
