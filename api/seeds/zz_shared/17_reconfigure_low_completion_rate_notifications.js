const Promise = require('bluebird')
const { rowsAsObject, seed } = require('../utils')

module.exports = seed(async knex => {
  const { abbreviation } = await knex('Country').first()

  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  // Reset all notifications and issues for Low Completion Rate notification type
  await knex('Notification')
    .whereIn(
      'notificationTypeId',
      knex('NotificationType').where('issueTypeId', issueTypes.SiteWithLowFieldCompletionRate.id).distinct('id')
    )
    .delete()
  await knex('Issue').where('issueTypeId', issueTypes.SiteWithLowFieldCompletionRate.id).del()

  // MW and BD have the custom fields weight set, so we are going to keep the notification types but disable them
  // By disabling them we allow the user to revisit the configuration and enable the notification types manually
  if (['MW', 'BD'].includes(abbreviation)) {
    const notificationTypes = await knex('NotificationType as nt')
      .where('issueTypeId', issueTypes.SiteWithLowFieldCompletionRate.id)
      .select('nt.id as notificationTypeId')
    await Promise.each(notificationTypes, async ({ notificationTypeId }) => {
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
          enabled: false,
        })
    })
  } else {
    // For all the other countries, having this notification type doesn't make any sense, so we are going to remove it
    await knex('NotificationType').where('issueTypeId', issueTypes.SiteWithLowFieldCompletionRate.id).delete()
  }
}, __filename)
