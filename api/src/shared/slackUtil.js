const { WebClient } = require('@slack/web-api')
const isEmpty = require('lodash/isEmpty')
const isNil = require('lodash/isNil')
const logger = require('./logger')

const ERROR_CODES = { NOT_IN_CHANNEL: 'not_in_channel' }
const options = {}
const web = new WebClient(process.env.slack_token, options)

const joinChannel = async channelId => {
  let ok = true
  try {
    await web.conversations.join({
      channel: channelId,
    })
  } catch (error) {
    logger.error(error)
    ok = false
  }
  return ok
}

const sendSlackMessage = async (message, channel = null) => {
  const channelId = channel || process.env.slack_channel_id
  // Only try sending a message if:
  // - The slack token was defined in the env file
  // - The slack channel was defined in the env file or specified in the parameter
  if (
    !isNil(process.env.slack_token) &&
    !isEmpty(process.env.slack_token) &&
    !isNil(channelId) &&
    !isEmpty(channelId)
  ) {
    try {
      // Try posting the message
      await web.chat.postMessage({
        text: message,
        channel: channelId,
      })
    } catch (error) {
      // If the App didn't join the desired channel yet, we need to join it
      if (error.data.error === ERROR_CODES.NOT_IN_CHANNEL) {
        const joinChannelOK = await joinChannel(channelId)
        // If joining the channel did not end on an unexpected error, then try sending the slack message again
        if (joinChannelOK) await sendSlackMessage(message, channelId)
      }
      // Any other kind of error, like channel not found, invalid auth, etc.
      else logger.error(error)
    }
  }
}

module.exports = {
  sendSlackMessage,
}
