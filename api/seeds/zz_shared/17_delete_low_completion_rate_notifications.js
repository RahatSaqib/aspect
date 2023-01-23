const { rowsAsObject, seed } = require('../utils')

module.exports = seed(async knex => {
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')
  await knex('Notification')
    .whereIn(
      'notificationTypeId',
      knex('NotificationType').where('issueTypeId', issueTypes.SiteWithLowFieldCompletionRate.id).distinct('id')
    )
    .delete()
  await knex('NotificationType').where('issueTypeId', issueTypes.SiteWithLowFieldCompletionRate.id).del()
}, __filename)
