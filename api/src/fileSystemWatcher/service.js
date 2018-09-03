function onNewFileDetected({ filePath }, { messageContext }) {
  console.log(filePath)
  /*const context = messageContext.bindActionCreators({ webhookMessagePending })

  return context.transact(async knex => {
    context.webhookMessagePending(webhookMessageId)
  })*/
}

module.exports = {
  onNewFileDetected,
}
