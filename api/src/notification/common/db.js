const { transact } = require('../../db')
const {
  fileContentTypeToId,

  messageSeverityToId,
  notificationTypeCategoryToId,
} = require('../shared/dictionary')
const { validateFilterCondition } = require('./validations')

async function saveNotificationType({ id: notificationTypeId, partnerId, userId, payload, issueTypeId = null }) {
  const fileContentTypeId = await fileContentTypeToId('applicationJson')
  const messageSeverityId = await messageSeverityToId('Alert')
  const notificationTypeCategoryId = await notificationTypeCategoryToId('resultBased')
  const {
    areaItems,
    deviceLevelId,
    jobFunctions,
    persons,
    sendToPatient,
    name,
    result,
    //
    sendEmail,
    emailBody,
    emailSubject,
    //
    sendSms,
    smsBody,
    //
    sendWeb,
    webBody,
    webUrl,
    enabled,
  } = payload
  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  }

  return transact(async knex => {
    // TODO: add extra validations for the other filterCondition properties
    const filterConditionValidation = await validateFilterCondition({
      jobFunctions,
      persons,
      sendToPatient,
    })
    if (filterConditionValidation !== true) return filterConditionValidation

    /**
     * helpers
     */
    const insertEmailTemplate = async () =>
      knex('EmailTemplate').insert({
        subject: emailSubject,
        body: emailBody,
        htmlBody: emailBody
          .split('\n')
          .map(line => `<div>${line}</div>`)
          .join(''),
        ...auditFields,
      })
    const insertSmsTemplate = async () =>
      knex('SmsTemplate').insert({
        message: smsBody,
        ...auditFields,
      })
    const insertWebHookTemplate = async () =>
      knex('WebhookTemplate').insert({
        method: 'POST',
        url: webUrl,
        payload: webBody,
        fileContentTypeId,
        ...auditFields,
      })
    let messageTypeId

    if (!notificationTypeId) {
      /**
       * insert base props in NotificationType (without messageTypeId yet)
       */
      ;[notificationTypeId] = await knex('NotificationType').insert({
        notificationTypeCategoryId,
        partnerId,
        issueTypeId,
        level: 1,
        canAcknowledge: 0,
        name,
        enabled,
        ...auditFields,
      })
      /**
       * create *Template items
       */
      let emailTemplateId = null
      let smsTemplateId = null
      let webHookTemplateId = null
      if (sendEmail) {
        ;[emailTemplateId] = await insertEmailTemplate()
      }
      if (sendSms) {
        ;[smsTemplateId] = await insertSmsTemplate()
      }
      if (sendWeb) {
        ;[webHookTemplateId] = await insertWebHookTemplate()
      }
      /**
       * create MessageType and then put it in NotificationType table with remaining props
       */
      ;[messageTypeId] = await knex('MessageType').insert({
        messageSeverityId,
        emailTemplateId,
        smsTemplateId,
        webHookTemplateId,
      })
    } else {
      let whereClause
      await knex('NotificationType')
        .update({
          name,
          updatedOn: now,
          updatedBy: userId,
          enabled,
        })
        .where({ id: notificationTypeId })
      ;({ messageTypeId } = await knex
        .select('messageTypeId')
        .from('NotificationType')
        .where({ id: notificationTypeId })
        .first())
      let { emailTemplateId, smsTemplateId, webHookTemplateId } = await knex
        .select('emailTemplateId', 'smsTemplateId', 'webHookTemplateId')
        .from('MessageType')
        .where('id', messageTypeId)
        .first()

      /**
       * EmailTemplate
       */
      if (emailTemplateId) {
        whereClause = { id: emailTemplateId }
        // update
        if (sendEmail) {
          await knex('EmailTemplate')
            .where(whereClause)
            .update({
              subject: emailSubject,
              body: emailBody,
              htmlBody: emailBody
                .split('\n')
                .map(line => `<div>${line}</div>`)
                .join(''),
              updatedOn: now,
              updatedBy: userId,
            })
        }
      } else if (sendEmail) {
        // insert
        ;[emailTemplateId] = await insertEmailTemplate()
      }
      /**
       * SmsTemplate
       */
      if (smsTemplateId) {
        whereClause = { id: smsTemplateId }
        // update
        if (sendSms) {
          await knex('SmsTemplate')
            .update({
              message: smsBody,
              updatedOn: now,
              updatedBy: userId,
            })
            .where(whereClause)
        }
      } else if (sendSms) {
        ;[smsTemplateId] = await insertSmsTemplate()
      }
      /**
       * WebhookTemplate
       */
      if (webHookTemplateId) {
        whereClause = { id: webHookTemplateId }
        // update
        if (sendWeb) {
          await knex('WebhookTemplate')
            .update({
              payload: webBody,
              url: webUrl,
              updatedOn: now,
              updatedBy: userId,
            })
            .where(whereClause)
        }
      } else if (sendWeb) {
        ;[webHookTemplateId] = await insertWebHookTemplate()
      }
      //
      await knex('MessageType')
        .update({
          emailTemplateId,
          smsTemplateId,
          webHookTemplateId,
        })
        .where({ id: messageTypeId })
    }

    /**
     * update remaining fields in NotificationType
     */
    await knex('NotificationType')
      .update({
        messageTypeId,
        filterCondition: JSON.stringify({
          areaItems,
          deviceLevelId,
          jobFunctions,
          persons,
          result,
          sendEmail,
          sendSms,
          sendToPatient,
          sendWeb,
          enabled,
        }),
      })
      .where({ id: notificationTypeId })

    return {
      ok: true,
      notificationTypeId,
    }
  }).catch(err => {
    return {
      ok: false,
      error: err.message,
    }
  })
}

module.exports = { saveNotificationType }
