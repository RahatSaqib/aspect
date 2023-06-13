const Promise = require('bluebird')
const _ = require('lodash')
const addIssue = require('./add_issue')

const { getBaseIssues } = require('../relatedObjects/issues')

module.exports = async function cleanIssueTypes(knex, adminUserName, partnerExternalId) {
  const { userId, partnerId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': adminUserName })
    .first('p.lastPartnerId as partnerId', 'p.userId')

  const auditFields = {
    createdOn: new Date(),
    createdBy: userId,
    updatedOn: new Date(),
    updatedBy: userId,
  }

  const issueTypes = await knex('IssueType').select()
  const configuredIssues = Object.keys(await getBaseIssues(auditFields))

  await Promise.each(issueTypes, async issueType => {
    if (!_.includes(configuredIssues, issueType.externalId)) {
      const issuesToDelete = await knex('Issue').where({ issueTypeId: issueType.id }).pluck('id as issueId')

      if (_.compact(issuesToDelete).length === 0) return
      const notifications = await knex('Notification')
        .whereIn('issueId', issuesToDelete)
        .select(
          'id',
          'alertMessageId',
          'emailMessageId',
          'smsMessageId',
          'pushNotificationMessageId',
          'webhookMessageId'
        )

      await knex('EmailMessage')
        .whereIn(
          'id',
          _.map(notifications, n => n.emailMessageId)
        )
        .delete()
      await knex('AlertMessage')
        .whereIn(
          'id',
          _.map(notifications, n => n.alertMessageId)
        )
        .delete()
      await knex('SmsMessage')
        .whereIn(
          'id',
          _.map(notifications, n => n.smsMessageId)
        )
        .delete()
      await knex('PushNotificationMessage')
        .whereIn(
          'id',
          _.map(notifications, n => n.pushNotificationMessageId)
        )
        .delete()
      await knex('WebhookMessage')
        .whereIn(
          'id',
          _.map(notifications, n => n.webhookMessageId)
        )
        .delete()
      await knex('Notification').whereIn('issueId', issuesToDelete).delete()
      await knex('Issue')
        .whereIn(
          'id',
          _.map(issuesToDelete, issue => issue.issueId)
        )
        .delete()

      await knex('IssueEventTrigger').where({ issueTypeId: issueType.id }).delete()
      await knex('IssueResolutionTrigger').where({ issueTypeId: issueType.id }).delete()
      await knex('NotificationType').where({ issueTypeId: issueType.id }).delete()
      await knex('IssueEscalationTrigger').where({ issueTypeId: issueType.id }).delete()
      await knex('IssueType').where({ id: issueType.id }).delete()
    }
  })
  const { jobFunctionAdminId } =
    (await knex('JobFunction')
      .where({
        externalId: 'systemOne',
        partnerId,
      })
      .first('id as jobFunctionAdminId')) ||
    (await knex('JobFunction')
      .where({
        externalId: 'admin',
        partnerId,
      })
      .first('id as jobFunctionAdminId'))

  await Promise.each(Object.values(configuredIssues), async externalId => {
    return addIssue(knex, externalId, [jobFunctionAdminId], partnerExternalId, adminUserName)
  })
}
