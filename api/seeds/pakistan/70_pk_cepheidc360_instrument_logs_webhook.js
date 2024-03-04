/* eslint-disable import/no-dynamic-require */
const { issueEventStatusToId, notificationTypeCategoryToId } = require('../../src/shared/dictionary')
const { getPartnerByExternalId } = require('../utils')

const partnerData = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerData.partner.externalId)

  // WebhookTemplate
  const { id: webhookTemplateId } =
    (await knex('WebhookTemplate as t').where('t.externalId', 'CepheidC360InstrumentLogs').first('t.id')) || {}

  // MessageType
  const { id: messageTypeId } =
    (await knex('MessageType as t').where('t.webhookTemplateId', webhookTemplateId).first('t.id')) || {}

  // IssueType
  const { id: issueTypeId } =
    (await knex('IssueType as t').where('t.externalId', 'CepheidC360InstrumentLogsReceived').first('t.id')) || {}

  // NotificationType
  let { id: notificationTypeId } =
    (await knex('NotificationType as t')
      .where('t.name', 'Cepheid Instrument Log Webhook Notification')
      .first('t.id')) || {}
  if (!notificationTypeId) {
    const issueBasedNotificationTypeCategoryId = await notificationTypeCategoryToId('issueBased')
    const notificationType = {
      notificationTypeCategoryId: issueBasedNotificationTypeCategoryId,
      partnerId,
      issueTypeId,
      filterCondition: '{"sendSms": false, "sendWeb": true, "sendEmail": false}',
      level: 1,
      canAcknowledge: false,
      messageTypeId,
      name: 'Cepheid Instrument Log Webhook Notification',
      createdOn: '2024-01-01 00:00:00',
      updatedOn: '2024-01-01 00:00:00',
      sendToContactsWithMatchingTags: false,
      enabled: true,
    }
    ;[notificationTypeId] = await knex('NotificationType').insert(notificationType)
  }

  // IssueEventTrigger
  let { id: issueEventTriggerId } =
    (await knex('IssueEventTrigger as t').where('t.issueTypeId', issueTypeId).first('t.id')) || {}
  if (!issueEventTriggerId) {
    const issueEventStatusTriggeredId = await issueEventStatusToId('Triggered')
    const issueEventTrigger = {
      partnerId,
      issueTypeId,
      issueEventStatusId: issueEventStatusTriggeredId,
      triggerConditions: '{"action": "CEPHEID_C360_INSTRUMENT_LOG_RECEIVED"}',
      filterIssueCondition: '{"skipFindingOpenIssue": true}',
      createdOn: '2024-01-01 00:00:00',
      updatedOn: '2024-01-01 00:00:00',
    }
    ;[issueEventTriggerId] = await knex('IssueEventTrigger').insert(issueEventTrigger)
  }

  // IssueResolutionTrigger
  let { id: issueResolutionTriggerId } =
    (await knex('IssueResolutionTrigger as t').where('t.issueTypeId', issueTypeId).first('t.id')) || {}
  if (!issueResolutionTriggerId) {
    const issueResolutionTrigger = {
      partnerId,
      issueTypeId,
      resolutionConditions:
        '{"evaluationMethod": "webhook-message-status", "evaluationParameter": {"messageStatusExternalId": "Sent"}}',
      createdOn: '2024-01-01 00:00:00',
      updatedOn: '2024-01-01 00:00:00',
    }
    ;[issueResolutionTriggerId] = await knex('IssueResolutionTrigger').insert(issueResolutionTrigger)
  }
}, __filename)
