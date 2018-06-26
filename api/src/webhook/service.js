const { webhookMessageSent } = require('./actions')
const dictionary = require('../shared/dictionary')
const {
  addDataSourceToQuery,
  processUsingDataSourceQuery,
} = require('../stringTemplate/service')

function onWebhookMessageCreated({ webhookMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ webhookMessageSent })

  return context.transact(async knex => {
    const { payload } = await createWebhookMessageFromTemplate(
      knex,
      webhookMessageId
    )
    const messageStatusId = (await dictionary.messageStatusToId()).Sent

    await knex('WebhookMessage')
      .where({ id: webhookMessageId })
      .update({
        payload,
        messageStatusId,
        updatedOn: new Date(),
      })

    context.webhookMessageSent(webhookMessageId)
  })
}

async function createWebhookMessageFromTemplate(knex, webhookMessageId) {
  const data = await knex('WebhookMessage as m')
    .innerJoin('WebhookTemplate as tmpl', 'm.webhookTemplateId', 'tmpl.id')
    .leftJoin('Notification as n', 'n.webhookMessageId', 'm.id')
    .modify(addDataSourceToQuery, { message: 'm', notification: 'n' })
    .where({ 'm.id': webhookMessageId })
    .first('tmpl.payload as payloadTemplate')

  return processUsingDataSourceQuery(data, ['payloadTemplate'])
}

module.exports = {
  onWebhookMessageCreated,
}
