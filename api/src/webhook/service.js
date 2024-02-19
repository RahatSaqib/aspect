const _ = require('lodash')
const { createFetch, base, method, params, header, body } = require('http-client')
const { differenceInMinutes } = require('date-fns')
const Promise = require('bluebird')
const { webhookMessagePending, webhookMessageSent, webhookMessageError } = require('./actions')
const { notificationMessageProcessed } = require('../notification/actions')
const { resolveIssues, escalateIssues } = require('../issue/actions')
const { messageStatusToId } = require('../shared/dictionary')
const { addDataSourceToQuery, processUsingDataSourceQuery } = require('../stringTemplate/service')
const { getConstraints } = require('../auth/constraints')
const { createStreamFromFileReference } = require('../file/service')

const { loadPlugin } = require('../plugin/loadPlugin')

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
      'tmpl.params as paramsTemplate'
    )

  const message = await processUsingDataSourceQuery(
    data,
    ['payloadTemplate', 'urlTemplate', 'fileNameTemplate'],
    authLikeObject
  )
  // TODO replace template values of header/params
  message.headers = data.headersTemplate
  message.params = data.paramsTemplate
  return message
}

async function onWebHookServerCheckTokens(action, context) {
  return context.messageContext.run(async knex => {
    /**
     * TODO: think if makes sense to cache partner's and deviceType's plugin names
     */
    const partnerPlugins = await knex('Partner').select('id as partnerId', 'plugin as partnerPluginName')
    const deviceTypePlugins = await knex('DeviceType').select('id as deviceTypeId', 'plugin as deviceTypePluginName')

    await Promise.each(partnerPlugins, async ({ partnerPluginName }) => {
      await Promise.each(deviceTypePlugins, async ({ deviceTypePluginName }) => {
        const getWebhookServers = await loadPlugin(partnerPluginName, deviceTypePluginName, 'getWebHookServers')
        const webhookServers = await getWebhookServers(context)
        await Promise.each(_.keys(webhookServers), async serverKey => {
          const server = webhookServers[serverKey]
          const { authorize, refresh, getExpirationDate } = server
          const expiresOn = getExpirationDate()
          const now = new Date()

          // eslint-disable-next-line no-console
          console.log('_________________ check', {
            accessToken: server.getAccessToken(),
            refreshToken: server.getRefreshToken(),
            expirationDate: server.getExpirationDate(),
            isTokenValid: server.isTokenValid(),
            now,
            diff: differenceInMinutes(expiresOn, now),
          })

          if (!expiresOn) {
            await authorize()
            // eslint-disable-next-line no-console
            console.log('_________________ authorize', {
              accessToken: server.getAccessToken(),
              refreshToken: server.getRefreshToken(),
              expirationDate: server.getExpirationDate(),
              isTokenValid: server.isTokenValid(),
            })
          } else if (differenceInMinutes(expiresOn, now) <= 10) {
            /**
             * ^^^^
             * TODO: think to move 10 to either .env or in plugin (if different
             * webhook servers may have different elapsed time until refresh token)
             */
            await refresh()
            // eslint-disable-next-line no-console
            console.log('_________________ refresh', {
              accessToken: server.getAccessToken(),
              refreshToken: server.getRefreshToken(),
              expirationDate: server.getExpirationDate(),
              isTokenValid: server.isTokenValid(),
            })
          }
        })
      })
    })
  })
}

async function onPostResultToWebHookServers(action, context) {
  return context.messageContext.run(async knex => {
    const { resultId } = action
    /**
     * get plugin names for result's deviceType and partner
     */
    const { deviceTypePluginName, partnerPluginName } =
      (await knex('Result as r')
        .innerJoin('Device as d', 'r.deviceId', 'd.id')
        .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .innerJoin('Partner as p', 'r.partnerId', 'p.id')
        .where('r.id', resultId)
        .first('dt.plugin as deviceTypePluginName', 'p.plugin as partnerPluginName')) || {}
    /**
     * get all webhook servers, if any defined
     */
    const getWebhookServers = await loadPlugin(partnerPluginName, deviceTypePluginName, 'getWebHookServers')
    const webhookServers = await getWebhookServers(context)
    /**
     * loop all webhook servers and call their postResult method
     */
    await Promise.each(_.keys(webhookServers), async serverKey => {
      const server = webhookServers[serverKey]
      const { pushResult, isTokenValid } = server

      if (isTokenValid()) {
        // eslint-disable-next-line no-console
        console.log('_________________ post', {
          accessToken: server.getAccessToken(),
          refreshToken: server.getRefreshToken(),
          expirationDate: server.getExpirationDate(),
          resultId,
          isTokenValid: server.isTokenValid(),
        })

        await pushResult(knex, resultId)
      } else {
        /**
         * TODO: discuss what to do if token is invalid.
         * May be repeat attempt few more times (how many), or just
         * throw an error only?
         */
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
