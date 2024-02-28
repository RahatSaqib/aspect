const _ = require('lodash')
const { createFetch, base, params, header, method, body } = require('http-client')
const { differenceInMinutes } = require('date-fns')
const Promise = require('bluebird')
const { webhookMessagePending, webhookMessageSent, webhookMessageError, webhookMessageCreated } = require('./actions')
const { notificationMessageProcessed } = require('../notification/actions')
const { resolveIssues, escalateIssues } = require('../issue/actions')
const { messageStatusToId } = require('../shared/dictionary')
const { addDataSourceToQuery, processUsingDataSourceQuery } = require('../stringTemplate/service')
const { getConstraints } = require('../auth/constraints')
const { createStreamFromFileReference } = require('../file/service')
const allWebhookServers = require('./servers')
const { EXTERNAL_IDS } = require('../shared/constants')

async function onWebhookMessageCreated({ webhookMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ webhookMessagePending })

  return context.transact(async knex => {
    const { payload, url, headers, params, fileName } = await createWebhookMessageFromTemplate(knex, webhookMessageId)
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

    await knex('WebhookMessage').where({ id: webhookMessageId }).update(messageUpdates)

    context.webhookMessagePending(webhookMessageId)
  })
}

async function onWebhookMessagePending({ webhookMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    webhookMessageSent,
    webhookMessageError,
  })
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
        'fct.mimeSubType',
        'tmpl.okResponseSuccessRegex'
      )
    if (message) {
      const contentType = `${message.mimeType}/${message.mimeSubType}`
      const fetchArgs = [method(message.method)]
      if (message.urlBase != null) {
        fetchArgs.push(base(message.urlBase))
      }
      if (message.headers != null) {
        _.forEach(JSON.parse(message.headers), (value, key) => fetchArgs.push(header(key, value)))
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
        fileStream = await createStreamFromFileReference(knex, message.fileReferenceId)
        if (fileStream == null) {
          webhookError = true
        }
      }

      const messageUpdates = {}
      if (!webhookError) {
        try {
          const fetch = createFetch(...fetchArgs)
          const resp = await fetch(message.url)
          if (fileStream != null) {
            resp.body.pipe(fileStream)
          }
          messageUpdates.response = `${resp.status}`
          if (resp.statusText) {
            messageUpdates.response += ` - ${resp.statusText}`
          }
          const responseText = await resp.text()
          if (responseText) {
            messageUpdates.response += ` ${responseText}`
          }
          if (message.okResponseSuccessRegex) {
            webhookError = !(
              messageUpdates.response && new RegExp(message.okResponseSuccessRegex, 'im').test(messageUpdates.response)
            )
          } else {
            webhookError = !resp.ok
          }
        } catch (err) {
          webhookError = true
          messageUpdates.response = err.toString()
        }
      }
      const now = new Date()
      messageUpdates.updatedOn = now
      const messageStatusIdSent = await messageStatusToId('Sent')
      const messageStatusIdError = await messageStatusToId('Error')
      if (webhookError) {
        messageUpdates.messageStatusId = messageStatusIdError
      } else {
        messageUpdates.messageStatusId = messageStatusIdSent
        if (message.fileReferenceId != null && message.resultId != null) {
          await knex('ResultFileReference').insert({
            resultId: message.resultId,
            fileReferenceId: message.fileReferenceId,
          })
        }
      }
      await knex('WebhookMessage').where({ id: webhookMessageId }).update(messageUpdates)

      if (messageUpdates.messageStatusId === messageStatusIdSent) {
        context.webhookMessageSent(webhookMessageId)
      } else if (messageUpdates.messageStatusId === messageStatusIdError) {
        context.webhookMessageError(webhookMessageId)
      }
    }
  })
}

async function onWebhookMessageSent({ webhookMessageId }, { messageContext }) {
  return finalizeWebhookMessage(webhookMessageId, messageContext)
}

async function onWebhookMessageError({ webhookMessageId }, { messageContext }) {
  return finalizeWebhookMessage(webhookMessageId, messageContext)
}

async function finalizeWebhookMessage(webhookMessageId, messageContext) {
  const context = messageContext.bindActionCreators({
    resolveIssues,
    escalateIssues,
    notificationMessageProcessed,
  })
  context.notificationMessageProcessed({ webhookMessageId })
  return context.run(async knex => {
    const { issueId } =
      (await knex('WebhookMessage as m')
        .join('Notification as n', 'm.id', 'n.webHookMessageId')
        .where('m.id', webhookMessageId)
        .first('n.issueId')) || {}
    if (issueId) {
      context.resolveIssues(issueId)
      context.escalateIssues(issueId)
    }
  })
}

async function createWebhookMessageFromTemplate(knex, webhookMessageId) {
  const { personId, resultId, reportId } = await knex('WebhookMessage as w')
    .leftJoin('Notification as n', 'n.webhookMessageId', 'w.id')
    .where('w.id', webhookMessageId)
    .first('w.personId', 'w.resultId', 'n.reportId')

  const authLikeObject = { credentials: { personId } }
  const dataConstraints = await getConstraints(authLikeObject.credentials)

  const data = await knex('WebhookMessage as m')
    .innerJoin('WebhookTemplate as tmpl', 'm.webhookTemplateId', 'tmpl.id')
    .leftJoin('Notification as n', 'n.webhookMessageId', 'm.id')
    .modify(
      addDataSourceToQuery,
      {
        message: 'm',
        notification: 'n',
      },
      dataConstraints,
      resultId,
      reportId
    )
    .where({ 'm.id': webhookMessageId })
    .first(
      'tmpl.payload as payloadTemplate',
      'tmpl.url as urlTemplate',
      'tmpl.fileName as fileNameTemplate',
      'tmpl.headers as headersTemplate',
      'tmpl.params as paramsTemplate',
      'm.params as messageParams',
      'm.headers as messageHeaders'
    )

  const message = await processUsingDataSourceQuery(
    data,
    ['payloadTemplate', 'urlTemplate', 'fileNameTemplate'],
    authLikeObject
  )
  // TODO replace template values of header/params
  message.headers = data.headersTemplate ?? data.messageHeaders
  message.params = data.paramsTemplate ?? data.messageParams
  return message
}

async function onWebHookServerCheckTokens(action, context) {
  return context.messageContext.run(async knex => {
    /**
     * get list of all registered webhook servers
     */
    const webhookServers = await knex('WebhookServer').select('*')
    /**
     *
     */
    await Promise.each(webhookServers, async srv => {
      const { id, externalId, expiresOn } = srv
      const server = allWebhookServers[externalId]
      if (!server) return

      srv.params = JSON.parse(srv.params || '{}')
      srv.headers = JSON.parse(srv.headers || '{}')

      const MINS_UNTIL_EXPIRES = 100

      const now = new Date()
      let headers
      let params
      if (!expiresOn) {
        headers = srv.headers.toLogin || {}
        params = srv.params.toLogin || {}
      } else if (differenceInMinutes(new Date(expiresOn), now) <= MINS_UNTIL_EXPIRES) {
        headers = srv.headers.toRefreshToken || {}
        params = srv.params.toRefreshToken || {}
      }

      if (headers) {
        const data = await server.getToken(headers, params)

        // eslint-disable-next-line no-console
        console.log('_________________ getToken', data)

        /**
         * update db with received accessToken et la
         */
        const { isValid = 0, accessToken, refreshToken = null, expiresOn = null } = data
        await knex('WebhookServer')
          .update({
            params: JSON.stringify(_.merge(srv.params, data.params || {})),
            headers: JSON.stringify(_.merge(srv.headers, data.headers || {})),
            isValid,
            accessToken,
            refreshToken,
            expiresOn,
          })
          .where('id', id)
      }
    })
  })
}

async function onPostResultToWebHookServers(action, context) {
  const { resultId, siteId, deviceId } = action
  const now = new Date()
  context.messageContext.bindActionCreators({
    webhookMessageCreated,
  })
  return context.messageContext.run(async knex => {
    const [webhookTemplate] = await knex('WebhookTemplate')
      .select('*')
      .where({ externalId: EXTERNAL_IDS.SEND_RESULT_TO_CEPHEID })

    const messageStatusId = await messageStatusToId('Initial')

    /**
     * get list of all registered webhook servers
     */
    const webhookServers = await knex('WebhookServer').select('*')
    await Promise.each(webhookServers, async srv => {
      const { isValid, accessToken } = srv
      if (isValid) {
        const [webhookMessageId] = await knex('WebhookMessage').insert({
          webhookTemplateId: webhookTemplate.id,
          url: webhookTemplate.url,
          payload: webhookTemplate.payload,
          params: JSON.stringify(webhookTemplate.params || {}),
          headers: JSON.stringify({
            Authorization: `Basic ${accessToken}`,
          }),
          resultId,
          createdOn: now,
          updatedOn: now,
          siteId,
          deviceId,
          messageStatusId,
        })

        await context.messageContext.webhookMessageCreated(webhookMessageId)
      }
    })
  })
}

module.exports = {
  onWebhookMessageCreated,
  onWebhookMessagePending,
  onWebhookMessageSent,
  onWebhookMessageError,

  onWebHookServerCheckTokens,
  onPostResultToWebHookServers,
}
