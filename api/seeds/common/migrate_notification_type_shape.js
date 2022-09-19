const _ = require('lodash')
const Promise = require('bluebird')

module.exports = async function (knex) {
  const notificationTypes = await knex('NotificationType as nt')
    .innerJoin('NotificationTypeCategory as ntc', 'ntc.id', 'nt.notificationTypeCategoryId')
    .innerJoin('MessageType as mt', 'mt.id', 'nt.messageTypeId')
    .where('ntc.externalId', 'issueBased')
    .whereNotNull('nt.jobfunctionId')
    .select(
      'nt.id as notificationTypeId',
      'nt.jobfunctionId as jobfunctionId',
      'mt.emailTemplateId as emailTemplateId',
      'mt.smsTemplateId as smsTemplateId',
      'mt.webhookTemplateId as webhookTemplateId'
    )

  await Promise.each(
    notificationTypes,
    async ({
      notificationTypeId,
      jobfunctionId,
      smsTemplateId = null,
      emailTemplateId = null,
      webhookTemplateId = null,
    }) =>
      knex('NotificationType')
        .where('id', notificationTypeId)
        .update({
          filterCondition: JSON.stringify({
            sendSms: !_.isNull(smsTemplateId),
            sendEmail: !_.isNull(emailTemplateId),
            sendWebhook: !_.isNull(webhookTemplateId),

            jobFunctions: [
              {
                tags: [],
                jobFunctionId: jobfunctionId,
              },
            ],
          }),
          jobfunctionId: null,
        })
  )
}
