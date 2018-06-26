const { webhookTrigger } = require('../../../webhook/actions')

function onResultLogged({ resultId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ webhookTrigger })
  context.webhookTrigger('commcareDownloadImage', { resultId })
}

module.exports = onResultLogged
