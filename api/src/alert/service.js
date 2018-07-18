const { alertMessageSent } = require('./actions')
const { messageStatusToId } = require('../shared/dictionary')
const {
  addDataSourceToQuery,
  processUsingDataSourceQuery,
} = require('../stringTemplate/service')

function onAlertMessageCreated({ alertMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ alertMessageSent })

  return context.transact(async knex => {
    const message = await createAlertMessageFromTemplate(knex, alertMessageId)
    const messageStatusId = await messageStatusToId('Sent')

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

async function createAlertMessageFromTemplate(knex, alertMessageId) {
  const data = await knex('AlertMessage as m')
    .innerJoin('AlertTemplate as tmpl', 'm.alertTemplateId', 'tmpl.id')
    .leftJoin('Notification as n', 'n.alertMessageId', 'm.id')
    .modify(addDataSourceToQuery, { message: 'm', notification: 'n' })
    .where({ 'm.id': alertMessageId })
    .first('tmpl.message as messageTemplate')

  const { message } = processUsingDataSourceQuery(data, ['messageTemplate'], {
    dynamic: true,
  })
  return message
}

module.exports = {
  onAlertMessageCreated,
}
