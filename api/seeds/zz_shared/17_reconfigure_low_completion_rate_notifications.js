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
    .select('nt.id as notificationTypeId', 'nt.messageTypeId as oldMessageTypeId')

  await Promise.each(notificationTypes, async ({ notificationTypeId, oldMessageTypeId }) => {
    const [emailTemplateId] = await knex('EmailTemplate').insert({
      subject: '{{site.name}} has a low completion rate issue',
      body: 'A low completion rate has been detected at {{site.name}} with {{site.completionRatePercentage}}% of custom fields completed.',
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

    await knex('MessageType').where({ id: oldMessageTypeId }).del()
  })
}, __filename)
