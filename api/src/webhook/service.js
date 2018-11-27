const _ = require('lodash')
const {
  createFetch,
  base,
  method,
  params,
  header,
  body,
} = require('http-client')
const { webhookMessagePending, webhookMessageSent } = require('./actions')
const { messageStatusToId } = require('../shared/dictionary')
const {
  addDataSourceToQuery,
  processUsingDataSourceQuery,
} = require('../stringTemplate/service')
const { createStreamFromFileReference } = require('../file/service')

function onWebhookMessageCreated({ webhookMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ webhookMessagePending })

  return context.transact(async knex => {
    const {
      payload,
      url,
      headers,
      params,
      fileName,
    } = await createWebhookMessageFromTemplate(knex, webhookMessageId)
    const now = new Date()
    const messageStatusId = await messageStatusToId('Pending')

    const messageUpdates = {
      url,
      payload,
      headers,
      params,
      messageStatusId,
      updatedOn: now,
    }

    if (fileName !== null && fileName !== '') {
      const { fileContentTypeId } = await knex('WebhookMessage as m')
        .join('WebhookTemplate as tmpl', 'm.webhookTemplateId', 'tmpl.id')
        .first('tmpl.fileContentTypeId')

      const [fileReferenceId] = await knex('FileReference').insert({
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
  return context.run(async knex => {
    // TODO If filename and resultId add ResultFileReference join
    const message = await knex('WebhookMessage as m')
      .leftJoin('WebhookTemplate as tmpl', 'm.webhookTemplateId', 'tmpl.id')
      .leftJoin('FileContentType as fct', 'tmpl.fileContentTypeId', 'fct.id')
      .where({ 'm.id': webhookMessageId })
      .first(
        'tmpl.method',
        'tmpl.urlBase',
        'm.url',
        'm.headers',
        'm.params',
        'm.payload',
        'm.fileReferenceId',
        'm.resultId',
        'fct.mimeType',
        'fct.mimeSubType'
      )
    if (message) {
      const contentType = `${message.mimeType}/${message.mimeSubType}`
      const fetchArgs = [method(message.method)]
      if (message.urlBase != null) {
        fetchArgs.push(base(message.urlBase))
      }
      if (message.headers != null) {
        _.forEach(JSON.parse(message.headers), (value, key) =>
          fetchArgs.push(header(key, value))
        )
      }
      if (message.params != null) {
        fetchArgs.push(params(JSON.parse(message.params)))
      }
      if (message.payload != null && message.payload !== '') {
        fetchArgs.push(body(message.payload, contentType))
      }

      let webhookError = false
      let fileStream = null
      if (message.fileReferenceId != null) {
        fileStream = await createStreamFromFileReference(
          knex,
          message.fileReferenceId
        )
        if (fileStream == null) {
          webhookError = true
        }
      }

      if (!webhookError) {
        const fetch = createFetch(...fetchArgs)
        const resp = await fetch(message.url)
        if (fileStream != null) {
          resp.body.pipe(fileStream)
        }
        webhookError = !resp.ok
      }

      const now = new Date()
      const messageUpdates = { updatedOn: now }

      const messageStatusIdSent = await messageStatusToId('Sent')
      if (webhookError) {
        messageUpdates.messageStatusId = await messageStatusToId('Error')
      } else {
        messageUpdates.messageStatusId = messageStatusIdSent
        if (message.fileReferenceId != null && message.resultId != null) {
          await knex('ResultFileReference').insert({
            resultId: message.resultId,
            fileReferenceId: message.fileReferenceId,
          })
        }
      }
      await knex('WebhookMessage')
        .where({ id: webhookMessageId })
        .update(messageUpdates)

      if (messageUpdates.messageStatusId === messageStatusIdSent) {
        context.webhookMessageSent(webhookMessageId)
      }
    }
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
      'tmpl.fileName as fileNameTemplate',
      'tmpl.headers as headersTemplate',
      'tmpl.params as paramsTemplate'
    )

  const message = await processUsingDataSourceQuery(data, [
    'payloadTemplate',
    'urlTemplate',
    'fileNameTemplate',
  ])
  // TODO replace template values of header/params
  message.headers = data.headersTemplate
  message.params = data.paramsTemplate
  return message
}

module.exports = {
  onWebhookMessageCreated,
  onWebhookMessagePending,
}
