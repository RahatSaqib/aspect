const _ = require('lodash')
const { webhookMessageCreated, webhookMessagePending } = require('./actions')
const dictionary = require('../shared/dictionary')
const {
  addDataSourceToQuery,
  processUsingDataSourceQuery,
} = require('../stringTemplate/service')

function onWebhookTrigger(
  { webhookTemplateExternalId, options },
  { messageContext }
) {
  const context = messageContext.bindActionCreators({ webhookMessageCreated })
  return context.transact(async knex => {
    const now = new Date()
    const messageStatusIds = await dictionary.messageStatusToId()
    const optionalConstraints = ['personId', 'siteId', 'deviceId', 'resultId']

    // Do we already have a message in pending or initial state?
    const webhookTemplate = await knex('WebhookTemplate as tmpl')
      .where({ 'tmpl.externalId': webhookTemplateExternalId })
      .first('id')
    if (webhookTemplate != null) {
      const { id: webhookTemplateId } = webhookTemplate
      const findPendingMessage = knex('WebhookMessage')
        .where({ webhookTemplateId })
        .whereIn('messageStatusId', [
          messageStatusIds.Initial,
          messageStatusIds.Pending,
        ])
      optionalConstraints.forEach(constraint => {
        const constraintId = options[constraint]
        if (constraintId != null) {
          findPendingMessage.where(constraint, constraintId)
        }
      })
      const pendingMessage = await findPendingMessage.first('id')
      if (pendingMessage == null) {
        // no pending message, create new message for template matching external id
        const [webhookMessageId] = await knex('WebhookMessage').insert(
          _.merge(
            {
              messageStatusId: messageStatusIds.Initial,
              webhookTemplateId,
              createdOn: now,
              updatedOn: now,
            },
            _.pick(options, optionalConstraints)
          )
        )
        context.webhookMessageCreated(webhookMessageId)
      }
    }
  })
}

function onWebhookMessageCreated({ webhookMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ webhookMessagePending })

  return context.transact(async knex => {
    const { payload, url } = await createWebhookMessageFromTemplate(
      knex,
      webhookMessageId
    )
    const messageStatusId = (await dictionary.messageStatusToId()).Pending

    await knex('WebhookMessage')
      .where({ id: webhookMessageId })
      .update({
        url,
        payload,
        messageStatusId,
        updatedOn: new Date(),
      })

    context.webhookMessagePending(webhookMessageId)
  })
}

async function createWebhookMessageFromTemplate(knex, webhookMessageId) {
  const data = await knex('WebhookMessage as m')
    .innerJoin('WebhookTemplate as tmpl', 'm.webhookTemplateId', 'tmpl.id')
    .leftJoin('Notification as n', 'n.webhookMessageId', 'm.id')
    .modify(addDataSourceToQuery, { message: 'm', notification: 'n' })
    .where({ 'm.id': webhookMessageId })
    .first('tmpl.payload as payloadTemplate', 'tmpl.url as urlTemplate')

  return processUsingDataSourceQuery(data, ['payloadTemplate', 'urlTemplate'])
}

module.exports = {
  onWebhookTrigger,
  onWebhookMessageCreated,
}
