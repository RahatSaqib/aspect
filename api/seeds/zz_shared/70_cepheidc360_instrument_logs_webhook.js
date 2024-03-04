/* eslint-disable import/no-dynamic-require */
const { messageSeverityToId, notificationTypeCategoryToId } = require('../../src/shared/dictionary')
const { getPartnerByExternalId } = require('../utils')

const partnerData = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerData.partner.externalId)

  // WebhookTemplate
  let { id: webhookTemplateId } =
    (await knex('WebhookTemplate as t').where('t.externalId', 'CepheidC360InstrumentLogs').first('t.id')) || {}
  if (!webhookTemplateId) {
    const webhookTemplate = {
      externalId: 'CepheidC360InstrumentLogs',
      method: 'POST',
      urlBase: 'https://datareceiver-dev.stg.c360.cepheid.com',
      url: '/datareceiver/api/v1/{{device.stickerInstrumentSerial}}/instrumentLogs',
      headers:
        '{"ClientId": "%%CEPHEID_CLIENT_ID%%", "Content-Type": "application/json", "Authorization": "Bearer %%CEPHEID_ACCESS_TOKEN%%"}',
      payload:
        '[{{#each deviceOperation.errors}}{"details":"{{this.Message}}","errorCode":{{this.ErrorCode}},"errorType":"{{this.ErrorType}}","instrumentSerialNumber":"{{@root.device.stickerInstrumentSerial}}","gatewaySerialNumber":"{{this.InstrumentSerialNumber}}","logTime":{{@root.deviceOperation.startedOn}},"moduleName":"{{this.SiteName}}","moduleSerialNumber":"{{this.SiteSerialNumber}}","softwareVersion":"{{this.SoftwareVersion}}","institutionGuid":"{{@root.site.institutionGuid}}","institutionName":"{{@root.site.institutionName}}","labName":"{{@root.site.name}}","labGuid":"{{@root.site.guid}}","labLocationCountry":"{{@root.country.name}}","labLocationRegion":"{{@root.site.state}}","labLocationDistrict":"{{@root.site.lga}}","logGuid":"{{@root.deviceOperation.guid}}"}{{/each}}]',
      fileContentTypeId: 24,
      createdOn: '2024-01-01 00:00:00',
      updatedOn: '2024-01-01 00:00:00',
      okResponseSuccessRegex: '204',
    }
    ;[webhookTemplateId] = await knex('WebhookTemplate').insert(webhookTemplate)
  }

  // MessageType
  let { id: messageTypeId } =
    (await knex('MessageType as t').where('t.webhookTemplateId', webhookTemplateId).first('t.id')) || {}
  if (!messageTypeId) {
    const messageSeverityAlertId = await messageSeverityToId('Alert')
    const messageType = {
      messageSeverityId: messageSeverityAlertId,
      webhookTemplateId,
    }
    ;[messageTypeId] = await knex('MessageType').insert(messageType)
  }

  // IssueCategory
  let { id: issueCategoryId } =
    (await knex('IssueCategory as c').where('c.externalId', 'CepheidC360InstrumentLogsReceived').first('c.id')) || {}
  if (!issueCategoryId) {
    const issueCategory = {
      name: 'Cepheid C360 InstrumentLogs Received',
      i18nKey: 'issueCategoryCepheidC360InstrumentLogsReceived',
      externalId: 'CepheidC360InstrumentLogsReceived',
      shortName: 'Cepheid C360 InstrumentLogs Received',
    }
    ;[issueCategoryId] = await knex('IssueCategory').insert(issueCategory)
  }

  // IssueType
  let { id: issueTypeId } =
    (await knex('IssueType as t').where('t.externalId', 'CepheidC360InstrumentLogsReceived').first('t.id')) || {}
  if (!issueTypeId) {
    const issueType = {
      issueCategoryId,
      externalId: 'CepheidC360InstrumentLogsReceived',
      defaultMessageTypeId: messageTypeId,
      name: 'Cepheid C360 InstrumentLogs Received',
      i18nKey: 'issueTypeCepheidC360InstrumentLogsReceived',
      hasTag: false,
      readyForNotification: true,
    }
    ;[issueTypeId] = await knex('IssueType').insert(issueType)
  }

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
}, __filename)
