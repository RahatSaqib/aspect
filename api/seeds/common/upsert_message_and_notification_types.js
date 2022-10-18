const _ = require('lodash')
const Promise = require('bluebird')

const { getBaseIssues } = require('../relatedObjects/issues')
const { getBaseNotificationTypes } = require('../relatedObjects/notificationTypes')
const { notificationTypeCategoryToId } = require('../../src/shared/dictionary')
const { upsertSingle } = require('../utils')

const now = new Date()

async function upsertMessageAndNotificationTypes(
  knex,
  partnerId,
  adminId,
  issueTypeExternalIds = ['DeviceOffline', 'DeviceNoResults', 'InventoryStockExpiring']
) {
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const issues = await getBaseIssues(auditFields)
  const notificationTypes = await getBaseNotificationTypes()
  const issueTypesInDb = await knex('IssueType')
    .whereIn('externalId', issueTypeExternalIds)
    .select('id', 'externalId', 'name')
  const jobFunctions = await knex('JobFunction').select('id', 'name')

  const notificationTypeCategoryId = await notificationTypeCategoryToId('issueBased')
  // iterate over the issue types so we can create message and notification types as needed
  await Promise.each(issueTypesInDb, async issueTypeInDb => {
    const issue = issues[issueTypeInDb.externalId]
    const notificationType = notificationTypes[issueTypeInDb.externalId]

    if (issueTypeInDb && issue && notificationType) {
      const { id: alertTemplateId } = issue.AlertTemplate
        ? (await knex('AlertTemplate').where('message', issue.AlertTemplate.message).first('id')) || {}
        : null

      const { id: smsTemplateId } = issue.SmsTemplate
        ? (await knex('SmsTemplate').where('message', issue.SmsTemplate.message).first('id')) || {}
        : null

      const { id: emailTemplateId } = issue.EmailTemplate
        ? (await knex('EmailTemplate').where('subject', issue.EmailTemplate.subject).first('id')) || {}
        : null

      // get all job functions that should be notified in any way of the issue
      const jobFunctionIds = _.uniq(_.concat(notificationType.alert, notificationType.email, notificationType.sms))

      // iterate over the job functions and find or create a matching message type for each
      await Promise.each(jobFunctionIds, async jobFunctionId => {
        const jobFunctionGetsAlert = notificationType.alert.indexOf(jobFunctionId) >= 0
        const jobFunctionGetsSms = notificationType.sms.indexOf(jobFunctionId) >= 0
        const jobFunctionGetsEmail = notificationType.email.indexOf(jobFunctionId) >= 0

        const messageTypeConfig = {
          alertTemplateId: jobFunctionGetsAlert ? alertTemplateId : null,
          smsTemplateId: jobFunctionGetsSms ? smsTemplateId : null,
          emailTemplateId: jobFunctionGetsEmail ? emailTemplateId : null,
          messageSeverityId: issue.MessageType.messageSeverityId,
        }
        const { id: messageTypeId } = await upsertMessageType(knex, messageTypeConfig)

        // if the message type doesn't exist yet and there are
        // job functions assigned to this issue, create the message type
        if (jobFunctionGetsAlert || jobFunctionGetsSms || jobFunctionGetsEmail) {
          const notificationTypeConfiguration = {
            partnerId,
            issueTypeId: issueTypeInDb.id,
            jobFunctionId,
            messageTypeId,
            level: 1,
            canAcknowledge: 0,
            notificationTypeCategoryId,
            name: `${issueTypeInDb.name} - ${jobFunctions.find(jf => jf.id === jobFunctionId).name}`,
            ...auditFields,
            sendToContactsWithMatchingTags: 0,
          }
          await upsertNotificationType(knex, notificationTypeConfiguration)
        }
      })
    }
  })
}

async function upsertMessageType(knex, messageTypeConfig) {
  return upsertSingle(knex, 'MessageType', ['alertTemplateId', 'smsTemplateId', 'emailTemplateId'], messageTypeConfig)
}

async function upsertNotificationType(knex, notificationTypeConfiguration) {
  return upsertSingle(
    knex,
    'NotificationType',
    ['partnerId', 'issueTypeId', 'jobFunctionId', 'messageTypeId'],
    notificationTypeConfiguration
  )
}

module.exports = {
  upsertMessageAndNotificationTypes,
}
