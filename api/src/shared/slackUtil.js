const { WebClient } = require('@slack/web-api')
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
  if (process.env.slack_token && channelId) {
    try {
      await web.chat.postMessage({
        text: message,
        channel: channelId,
      })
    } catch (error) {
      if (error.data.error === ERROR_CODES.NOT_IN_CHANNEL) {
        // Join the channel if did not already and re-try
        const joinChannelOK = await joinChannel(channelId)
        if (joinChannelOK) await sendSlackMessage(message, channelId)
      }
      // Avoid internal server errors, and just log to Sentry
      else logger.error(error)
    }
  }
}

module.exports = {
  sendSlackMessage,
}
