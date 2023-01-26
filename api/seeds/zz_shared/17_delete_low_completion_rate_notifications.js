const Promise = require('bluebird')
const { rowsAsObject, seed } = require('../utils')

module.exports = seed(async knex => {
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')
  await knex('Notification')
    .whereIn(
      'notificationTypeId',
      knex('NotificationType').where('issueTypeId', issueTypes.SiteWithLowFieldCompletionRate.id).distinct('id')
    )
    .delete()
  await knex('Issue').where('issueTypeId', issueTypes.SiteWithLowFieldCompletionRate.id).del()

  const notificationTypes = await knex('NotificationType as nt')
    .where('issueTypeId', issueTypes.SiteWithLowFieldCompletionRate.id)
    .select('nt.id as notificationTypeId')

  await Promise.each(notificationTypes, async ({ notificationTypeId }) => {
    const [emailTemplateId] = await knex('EmailTemplate').insert({
      subject: '{{site.name}} has a new completion rate issue',
      body: 'A new low completion rate issue has been created on {{site.name}} with a completion rate percentage of {{site.completionRatePercentage}}%',
      createdBy: 1,
      updatedBy: 1,
    })
    const [messageTypeId] = await knex('MessageType').insert({
      messageSeverityId: 2,
      alertTemplateId: null,
      smsTemplateId: null,
      emailTemplateId,
      webhookTemplateId: null,
      pushNotificationTemplateId: null,
    })

    await knex('NotificationType as nt')
      .where('nt.id', notificationTypeId)
      .update({
        'nt.filterCondition': knex.raw("JSON_SET(nt.filterCondition, '$.sendEmail', true)"),
        'nt.messageTypeId': messageTypeId,
      })
  })
}, __filename)
