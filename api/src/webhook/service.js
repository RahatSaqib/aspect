const _ = require('lodash')
const { createFetch, base, params, header, method, body } = require('http-client')
const { differenceInMinutes } = require('date-fns')
const Promise = require('bluebird')
const { webhookMessagePending, webhookMessageSent, webhookMessageError } = require('./actions')
const { notificationMessageProcessed } = require('../notification/actions')
const { resolveIssues, escalateIssues } = require('../issue/actions')
const { messageStatusToId, jobFunctionToId } = require('../shared/dictionary')
const { addDataSourceToQuery, processUsingDataSourceQuery } = require('../stringTemplate/service')
const { getConstraints } = require('../auth/constraints')
const { createStreamFromFileReference } = require('../file/service')
const { JOB_FUNCTION_EXTERNAL_ID_FOR_API } = require('../shared/constants')

const { loadPlugin } = require('../plugin/loadPlugin')
const { knex } = require('../db')
const { RESULT_STRING_TEMPLATE_FIELDS } = require('../result/query')
const { getResultForStringTemplateProcessing } = require('../result/service')

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

async function getWebhookServers(knex, context) {
  /**
   * get all internal API notifications
   */
  const jobFunctionIdForApi = await jobFunctionToId(JOB_FUNCTION_EXTERNAL_ID_FOR_API)
  const internalApiNotifications = await knex('NotificationType as nt')
    .innerJoin('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .innerJoin('WebhookTemplate as wh', 'mt.webhookTemplateId', 'wh.id')
    .where('nt.jobFunctionId', jobFunctionIdForApi)
    .select('wh.*')

  /**
   * TODO: think if makes sense to cache partner's and deviceType's plugin names.
   * See ticket ASP-6686 "Cache more data than we have in dictionary.js"
   */
  const partnerPlugins = await knex('Partner').select('id as partnerId', 'plugin as partnerPluginName')
  const deviceTypePlugins = await knex('DeviceType').select('id as deviceTypeId', 'plugin as deviceTypePluginName')

  let allServers = {}
  await Promise.each(partnerPlugins, async ({ partnerPluginName }) => {
    await Promise.each(deviceTypePlugins, async ({ deviceTypePluginName }) => {
      const getServers = await loadPlugin(partnerPluginName, deviceTypePluginName, 'getWebHookServers')
      const webhookServers = await getServers(context)

      await Promise.each(internalApiNotifications, async props => {
        const server = webhookServers[props.externalId]
        if (!server) return

        props.params = JSON.parse(props.params || '{}')
        props.headers = JSON.parse(props.headers || '{}')

        allServers = {
          ...allServers,
          [props.externalId]: {
            server,
            props,
          },
        }
      })
    })
  })
  return allServers
}

async function getInternalApiNotifications() {
  /**
   * get all internal API notifications
   */
  const jobFunctionIdForApi = await jobFunctionToId(JOB_FUNCTION_EXTERNAL_ID_FOR_API)
  const internalApiNotifications = await knex('NotificationType as nt')
    .innerJoin('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .innerJoin('WebhookTemplate as wh', 'mt.webhookTemplateId', 'wh.id')
    .where('nt.jobFunctionId', jobFunctionIdForApi)
    .select('wh.*')

  // eslint-disable-next-line no-console
  console.log('_________________ internalApiNotifications', internalApiNotifications)
  return internalApiNotifications
}

async function onWebHookServerCheckTokens(action, context) {
  return context.messageContext.run(async knex => {
    /**
     * helper func
     */
    const updateWebhookTemplate = async (id, params, headers, data) => {
      await knex('WebhookTemplate')
        .update({
          params: JSON.stringify(_.merge(params, data.params || {})),
          headers: JSON.stringify(_.merge(headers, data.headers)),
        })
        .where('id', id)
    }
    /**
     * get list of all registered/available webhook servers
     */
    const webhookServers = await getWebhookServers(knex, context)
    /**
     *
     */
    await Promise.each(_.keys(webhookServers), async key => {
      const { server, props } = webhookServers[key]

      // eslint-disable-next-line no-console
      console.log('_____ check - params', props.params)
      // eslint-disable-next-line no-console
      console.log('_____ check - headers', props.headers)

      const now = new Date()
      if (!props.params.expiresOn) {
        const data = await server.getToken(props.headers.toLogin || {}, props.params.toLogin || {})

        // eslint-disable-next-line no-console
        console.log('_________________ login', data)

        await updateWebhookTemplate(props.id, props.params, props.headers, data)
      } else if (differenceInMinutes(new Date(props.params.expiresOn), now) <= 100) {
        const data = await server.getToken(props.headers.toRefreshToken || {}, props.params.toRefreshToken || {})

        // eslint-disable-next-line no-console
        console.log('_________________ refresh', data)

        await updateWebhookTemplate(props.id, props.params, props.headers, data)
      }
    })
  })
}

async function onPostResultToWebHookServers(action, context) {
  const { resultId } = action
  return context.messageContext.run(async knex => {
    /**
     * get list of all registered/available webhook servers
     */
    const webhookServers = await getWebhookServers(context)

    // console.log('internalApiNotifications', internalApiNotifications)
    // console.log('web hook server', webhookServers)
    const result = await getResultForStringTemplateProcessing(
      resultId,
      [
        ...RESULT_STRING_TEMPLATE_FIELDS,
        'r.instrumentSerial',
        'r.assayId',
        'd.id as resultDeviceId',
        'rc1.externalId as resultCategory1',
        'st.name as stateName',
        'lga.name as cityName',
        knex.raw(
          "case when rc1.externalId in ('Error', 'Invalid', 'NoResult') then rc1.externalid else 'Success' end as resultOutcome"
        ),
      ],
      knex
    )
    // console.log('result', result)
    const {
      instrumentSerial,
      sampleExternalId,
      resultOutcome,
      sampleId,
      resultModuleName,
      siteName,
      siteId,
      stateName,
      cityName,
      resultRawData,
    } = result

    const {
      softwareVersion,
      reagentLotId,
      gxConnectVersion,
      moduleName,
      moduleSerialNumber,
      cartridgeSerial,
      country,
      computerId,
    } = JSON.parse(result.resultData)

    const testResult = {
      instrumentSerialNumber: instrumentSerial,
      gatewaySerialNumber: gxConnectVersion,
      instrumentModel: resultModuleName,
      softwareVersion,
      firmwareVersion: '2.5.0',
      operatingSystem: computerId,
      lisConnected: true,
      daisyChained: false,
      institutionGuid: '123456789',
      institutionName: 'Example Hospital',
      labName: siteName, // site name
      labGuid: siteId, // site id
      labLocationCountry: country,
      labLocationRegion: stateName, // state name
      labLocationDistrict: cityName, // site city
      adc2Psi: 0.5,
      errorStatus: 'OK',
      testResultGuid: resultId,
      resultCategory: resultOutcome,
      reagentLotId,
      instrumentSerial,
      sampleType: sampleExternalId,
      data: resultRawData,
      datagramFormat: 2,
      dataReductionAlgorithm: 3,
      icoreSerialNumber: 'ICORE123',
      moduleName,
      moduleSerialNumber,
      moduleColor: '6-Color',
      orderTime: 1645510800000,
      exportTime: 1645514400000,
      startTime: 1645512000000,
      endTime: 1645515600000,
      testModifiedTime: 1645516200000,
      testCreationInInstrument: 1645510800000,
      status: 2,
      sampleId,
      cartridgeSerialNumber: cartridgeSerial,
      analytes: [
        {
          analyteIndex: 1,
          analyteName: 'Cycle Threshold',
          curveFitResult: 0.98,
          cycleThreshold: 25,
          endpoint: 100,
          quantitativeResult: 0.05,
        },
      ],
      errors: [
        {
          errorCode: 5007,
          details: 'Error occurred during analysis',
          logTime: 1645515600000,
          severity: 2,
        },
      ],
    }
    /**
     *
     */
    await Promise.each(_.keys(webhookServers), async key => {
      const { server, props } = webhookServers[key]

      if (props.isValid) {
        await server.pushResult(props.headers.toPushResult || {}, props.params.toPushResult || {}, action)
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
