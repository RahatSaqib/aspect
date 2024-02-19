const { postResultToWebHookServers } = require('../../../webhook/actions')

async function onResultLogged({ resultId }, { messageContext }) {
  return messageContext.run(async () => {
    if (!messageContext.postResultToWebHookServers) {
      messageContext = messageContext.bindActionCreators({
        postResultToWebHookServers,
      })
    }
    await messageContext.postResultToWebHookServers(resultId)
  })
}

module.exports = onResultLogged
