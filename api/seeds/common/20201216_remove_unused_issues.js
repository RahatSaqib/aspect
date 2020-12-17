const Promise = require('bluebird')
const _ = require('lodash')

const { getBaseIssues } = require('../relatedObjects/issues')

module.exports = async function cleanIssueTypes(knex, partnerName) {
  const { userId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': partnerName })
    .first('p.lastPartnerId as partnerId', 'p.userId')

  const auditFields = {
    createdOn: new Date(),
    createdBy: userId,
    updatedOn: new Date(),
    updatedBy: userId,
  }

  const issueTypes = await knex('IssueType').select()
  await Promise.each(issueTypes, async issueType => {
    if (
      !_.includes(Object.keys(getBaseIssues(auditFields)), issueType.externalId)
    ) {
      const issuesToDelete = await await knex('Issue')
        .where({ issueTypeId: issueType.id })
        .select('id as issueId, resultId, deviceId')

      await knex('Notification').whereIn('issueId').delete()
      await knex('Issue')
        .whereIn(
          'id',
          _.map(issuesToDelete, issue => issue.issueId)
        )
        .delete()
      await knex('IssueType').where({ id: issueType.id }).delete()
      await knex('EmailMessage')
        .whereIn(
          'resultId',
          _.map(issuesToDelete, issue => issue.resultId)
        )
        .delete()
      await knex('AlertMessage')
        .whereIn(
          'resultId',
          _.map(issuesToDelete, issue => issue.resultId)
        )
        .delete()
      await knex('SmsMessage')
        .whereIn(
          'resultId',
          _.map(issuesToDelete, issue => issue.resultId)
        )
        .delete()
      await knex('PushNotificationMessage')
        .whereIn(
          'resultId',
          _.map(issuesToDelete, issue => issue.resultId)
        )
        .delete()
      await knex('WebhookMessage')
        .whereIn(
          'resultId',
          _.map(issuesToDelete, issue => issue.resultId)
        )
        .delete()
    }
  })
}
