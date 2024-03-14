const { seed, getPartnerByExternalId } = require('../utils')
const { notificationTypeCategoryToId, messageSeverityToId } = require('../../src/shared/dictionary')

const sendResultTemplate = require('../common/send_result_template')
const upsertWebHookTemplates = require('../common/upsert_webhook_templates')
const { GENEXPERT_ASSAYS } = require('../../src/shared/constants')

// eslint-disable-next-line import/no-dynamic-require
const partnerData = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)

module.exports = seed(async knex => {
  const { adminUserName } = partnerData
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerData.partner.externalId)

  const { id: userId } = await knex('User').where({ name: adminUserName }).first('id')
  const webhookTemplateId = await upsertWebHookTemplates(knex, [sendResultTemplate], userId)

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

  const now = new Date()
  const auditFields = {
    createdOn: now,
    updatedOn: now,
  }
  const result = Object.values(GENEXPERT_ASSAYS).map(assayId => ({ assayId }))

  // NotificationType
  let { id: notificationTypeId } =
    (await knex('NotificationType as t').where('t.name', 'Send Test Results to C360').first('t.id')) || {}
  if (!notificationTypeId) {
    const issueBasedNotificationTypeCategoryId = await notificationTypeCategoryToId('resultBased')
    const notificationType = {
      notificationTypeCategoryId: issueBasedNotificationTypeCategoryId,
      partnerId,
      filterCondition: JSON.stringify({
        sendSms: false,
        sendWeb: true,
        sendEmail: false,
        resultBasedScope: 'created',
        result,
      }),
      level: 1,
      canAcknowledge: false,
      messageTypeId,
      name: 'Send Test Results to C360',
      sendToContactsWithMatchingTags: false,
      enabled: true,
      ...auditFields,
    }
    ;[notificationTypeId] = await knex('NotificationType').insert(notificationType)
  }
}, __filename)
