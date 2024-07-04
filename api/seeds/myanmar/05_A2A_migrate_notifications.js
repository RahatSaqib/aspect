module.exports = require('../utils').seed(seed, __filename)
const { message } = require('hapi-sentry/schema')
const { notificationTypeCategoryToId, issueTypeToId, reportToId, jobFunctionToId } = require('../../src/shared/dictionary')
const { filter } = require('lodash')

// TODO: Pending JobFunctions and values inside JSON....

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ externalId: 'MoHS' }).first('id')

  const sourceTable = 'mig_Notifications' // This table is created by the migration script (file A2A-notifications.sql)

  const notificationDefs = await knex(sourceTable).select()

  notificationDefs.forEach(async ndef => {
    const notificationTypeCategoryId = await notificationTypeCategoryToId(ndef.notificationTypeCategory)
    const issueTypeId = await issueTypeToId(ndef.issueType)
    const reportId = await reportToId(ndef.report)
    const jobFunctionId = await jobFunctionToId(ndef.jobFunction)
    const messageTypeId = await createMessageType(knex, ndef)
    const notificationType = {
      partnerId,
      notificationTypeCategoryId,
      issueTypeId,
      reportId,
      jobFunctionId,
      filterCondition: ndef.filterCondition,
      level: ndef.level,
      canAcknowledge: ndef.canAcknowledge,
      messageTypeId,
      name: ndef.name,
      createdOn: ndef.createdOn,
      createdBy: ndef.createdBy,
      updatedOn: ndef.updatedOn,
      updatedBy: ndef.updatedBy,
      sendToContactsWithMatchingTags: ndef.sendToContactsWithMatchingTags,
      enabled: ndef.enabled,
      cronRecurrency: ndef.cronRecurrency,
    }
    if (ndef.filterCondition) {
      await preprocessFilterConditions(knex, ndef.filterCondition)
    }

    knex('NotificationType').insert(notificationType)
  });
}
async function createMessageType(knex, ndef) {
  const messageType = {
    messageSeverityId: ndef.messageSeverityId
  }
  if (ndef.alertMessage) {
    const alertTemplate = {
      message: ndef.alertMessage,
      hideWhenSiteFilterIsSelected: ndef.alertHideWhenSiteFilterIsSelected,
      hideWhenSiteFilterIsNotSelected: ndef.alertHideWhenSiteFilterIsNotSelected,
      createdOn: ndef.createdOn,
      createdBy: ndef.createdBy,
      updatedOn: ndef.updatedOn,
      updatedBy: ndef.updatedBy,
    }

    const [alertTemplateId] = await knex('AlertTemplate').insert(alertTemplate)
    messageType.alertTemplateId = alertTemplateId
  }

  if (ndef.emailSubject) {
    const emailTemplate = {
      subject: ndef.emailSubject,
      body: ndef.emailBody,
      htmlBody: ndef.emailHtmlBody,
      to: ndef.emailTo,
      attachments: ndef.emailAttachments,
      createdOn: ndef.createdOn,
      createdBy: ndef.createdBy,
      updatedOn: ndef.updatedOn,
      updatedBy: ndef.updatedBy,
    }

    const [emailTemplateId] = await knex('EmailTemplate').insert(emailTemplate)
    messageType.emailTemplateId = emailTemplateId
  }

  if (ndef.smsMessage) {
    const smsTemplate = {
      message: ndef.smsMessage,
      phoneNumber: ndef.smsPhoneNumber,
      createdOn: ndef.createdOn,
      createdBy: ndef.createdBy,
      updatedOn: ndef.updatedOn,
      updatedBy: ndef.updatedBy,
    }
    const [smsTemplateId] = await knex('SmsTemplate').insert(smsTemplate)
    messageType.smsTemplateId = smsTemplateId
  }

  if (ndef.pushTitle) {
    const pushNotificationTemplate = {
      title: ndef.pushTitle,
      body: ndef.pushBody,
      data: ndef.pushData,
      createdOn: ndef.createdOn,
      createdBy: ndef.createdBy,
      updatedOn: ndef.updatedOn,
      updatedBy: ndef.updatedBy,
    }
    const [pushNotificationTemplateId] = await knex('PushNotificationTemplate').insert(pushNotificationTemplate)
    messageType.pushNotificationTemplateId = pushNotificationTemplateId
  }
  const { id: messageSeverityId } = await knex('MessageSeverity').where({ externalId: ndef.messageSeverity }).first('id')
  messageType.messageSeverityId = messageSeverityId

  // Insert NotificationType
  const [messageTypeId] = await knex('MessageType').insert(messageType)
  return messageTypeId
}

async function preprocessFilterConditions(knex, filterCondition) {
  if (filterCondition.jobFunctions) {
    filterCondition.jobFunctions.forEach(async jf => {
      const { externalId: jobFunctionExternalId } = await knex("mig_JobFunctions").first("id", jf.jobFunctionId).externalId
      jf.jobFunctionId = await jobFunctionToId(jobFunctionExternalId)
    })
  }

  if (filterCondition.persons) {
    filterCondition.persons.forEach(async p => {
      const sourcePerson = await knex("mig_Persons").where('id', p.id).first()
      const person = await knex('Person as p')
        .where({ email: sourcePerson.email })
        .orWhere({ cell: sourcePerson.cell })
        .first('id')

    })
  }

  return filterCondition
}