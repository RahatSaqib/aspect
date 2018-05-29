const { alertMessageSent } = require('./actions')
const dictionary = require('../shared/dictionary')
const { createAlertMessageFromTemplate } = require('../stringTemplate/service')

function onAlertMessageCreated({ alertMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ alertMessageSent })

  return context.transact(async knex => {
    const message = await createAlertMessageFromTemplate(knex, alertMessageId)
    const messageStatusId = (await dictionary.messageStatusToId()).Sent

    await knex('AlertMessage')
      .where({ id: alertMessageId })
      .update({
        message,
        messageStatusId,
        updatedOn: new Date(),
      })

    context.alertMessageSent(alertMessageId)
  })
}

module.exports = {
  onAlertMessageCreated,
}
