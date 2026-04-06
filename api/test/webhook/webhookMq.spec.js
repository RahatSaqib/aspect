const { assert } = require('chai')
const { _ } = require('lodash')
const { knex } = require('../../src/db')
const { createMessageContext, queuePurge, waitForIdle, waitForAction } = require('../utils/mqUtils')
const config = require('../../src/config')
const { webhookMessageCreated } = require('../../src/webhook/actions')
const { messageStatusToId, fileContentTypeToId } = require('../../src/shared/dictionary')
const { processDynamicMessage } = require('../../src/stringTemplate/service')

describe('Sending Webhook Message via Message Queue', () => {
  const webhookTemplateIds = []
  const webhookMessageIds = []
  let adminId
  let defaultTestWebhookTemplateId
  let deviceApiKey
  let resultId
  let siteId
  let deviceId
  let initialMessageStatusId
  let errorMessageStatusId

  async function createWebHookTemplate(externalId, method, url, headers, payload, fileContentTypeId, adminId) {
    const testWebhookTemplate = await knex('WebhookTemplate').where({ externalId }).first('id')
    const now = new Date()
    const templateValues = {
      method,
      url,
      headers,
      payload,
      fileContentTypeId,
      updatedOn: now,
      updatedBy: adminId,
    }
    let webhookTemplateId
    if (!testWebhookTemplate) {
      ;[webhookTemplateId] = await knex('WebhookTemplate').insert({
        externalId,
        ...templateValues,
        createdOn: now,
        createdBy: adminId,
      })
      webhookTemplateIds.push(webhookTemplateId)
    } else {
      webhookTemplateId = testWebhookTemplate.id
      await knex('WebhookTemplate').where('id', testWebhookTemplate.id).update(templateValues)
    }
    return webhookTemplateId
  }

  before(async () => {
    ;({ id: adminId } = await knex('User').where({ name: 'admin' }).first('id'))
    ;({ token: deviceApiKey } = await knex('DeviceApiKey').where({ revoked: false }).first('token'))
    defaultTestWebhookTemplateId = await createWebHookTemplate(
      'testWebhookTemplate',
      'POST',
      `${config.url}/device/plugin/test-webhook`,
      `{"Authorization":"Bearer ${deviceApiKey}"}`,
      `{ "site": {{enclose (defaultTo site.id '') with='"'}}, "assay": {{enclose (defaultTo result.assay.id '') with='"'}} }`,
      await fileContentTypeToId('applicationJson'),
      adminId
    )
    ;({ id: resultId, siteId, deviceId } = await knex('Result').first('id', 'siteId', 'deviceId'))
    initialMessageStatusId = await messageStatusToId('Initial')
    errorMessageStatusId = await messageStatusToId('Error')
  })

  afterEach(async () => {
    // make sure MQ finished it's job before removing sample message
    await waitForIdle()

    // remove sample message
    if (!_.isEmpty(webhookMessageIds)) {
      await knex('WebhookMessage').whereIn('id', webhookMessageIds).delete()
    }
    webhookMessageIds.splice(0, webhookMessageIds.length)
    await queuePurge()
  })

  after(async () => {
    if (!_.isEmpty(webhookTemplateIds)) {
      await knex('WebhookTemplate').whereIn('id', webhookTemplateIds).delete()
    }
  })

  async function createWebhookMessage(webhookTemplateId) {
    if (!webhookTemplateId) {
      webhookTemplateId = defaultTestWebhookTemplateId
    }

    const now = new Date()
    const [messageId] = await knex('WebhookMessage').insert({
      webhookTemplateId,
      messageStatusId: initialMessageStatusId,
      personId: adminId,
      siteId,
      deviceId,
      resultId,
      createdOn: now,
      updatedOn: now,
    })
    webhookMessageIds.push(messageId)
    return messageId
  }

  it('should add record with status=Initial to WebhookMessage table to trigger MQ, and return "Error" for messageStatus when request returns non 200 Response', async () => {
    const messageId = await createWebhookMessage()
    // get MQ context and messageId of inserted record in AlertMessage
    const messageContext = await createMessageContext()
    messageContext.bindActionCreators({ webhookMessageCreated })

    // message goes through few states - Created, Sent
    const actionCreated = webhookMessageCreated(messageId)
    const waitForCreated = waitForAction(actionCreated)

    // dispatch to MQ a messageId (generated in AlertMessage)
    messageContext.webhookMessageCreated(messageId)

    await waitForCreated
    await waitForIdle()

    const msg = await knex('WebhookMessage').where('id', messageId).first()
    assert.equal(msg.messageStatusId, errorMessageStatusId)

    // make sure generated message does not have unprocessed curly braces {{ }}
    const payload = processDynamicMessage(msg.payload)
    assert(!payload.includes('{{') && !payload.includes('}}'), 'Webhook message template has not been parsed well')
  })
})
