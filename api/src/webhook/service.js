const _ = require('lodash')
const {
  webhookMessageCreated,
  webhookMessagePending,
  webhookMessageSent,
} = require('./actions')
const { messageStatusToId, fileStatusToId } = require('../shared/dictionary')
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
    const messageStatusIds = await messageStatusToId()
    const optionalConstraints = ['personId', 'siteId', 'deviceId', 'resultId']

    // TODO Do not retrigger for same results with filereference of same constraints/filename
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
    const { payload, url, fileName } = await createWebhookMessageFromTemplate(
      knex,
      webhookMessageId
    )
    const now = new Date()
    const messageStatusId = await messageStatusToId('Pending')

    const messageUpdates = {
      url,
      payload,
      messageStatusId,
      updatedOn: now,
    }

    if (fileName !== null && fileName !== '') {
      const fileStatusId = await fileStatusToId('Initial')
      const { fileContentTypeId } = await knex('WebhookMessage as m')
        .join('WebhookTemplate as tmpl', 'm.webhookTemplateId', 'tmpl.id')
        .first('tmpl.fileContentTypeId')

      const [fileReferenceId] = await knex('FileReference').insert({
        fileStatusId,
        fileContentTypeId,
        name: fileName,
        createdOn: now,
        updatedOn: now,
      })
      messageUpdates.fileReferenceId = fileReferenceId
    }

    await knex('WebhookMessage')
      .where({ id: webhookMessageId })
      .update(messageUpdates)

    context.webhookMessagePending(webhookMessageId)
  })
}

function onWebhookMessagePending({ webhookMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ webhookMessageSent })

  return context.transact(async knex => {
    // TODO If filename is set, download response to
    // /someconfiguredpath/filereference/{id}/{filename}
    // TODO If filename and resultId add ResultFileReference join

    const messageStatusId = await messageStatusToId('Sent')
    await knex('WebhookMessage')
      .where({ id: webhookMessageId })
      .update({
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
    .first(
      'tmpl.payload as payloadTemplate',
      'tmpl.url as urlTemplate',
      'tmpl.fileName as fileNameTemplate'
    )

  return processUsingDataSourceQuery(data, [
    'payloadTemplate',
    'urlTemplate',
    'fileNameTemplate',
  ])
}

module.exports = {
  onWebhookTrigger,
  onWebhookMessageCreated,
  onWebhookMessagePending,
}
