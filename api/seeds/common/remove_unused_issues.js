const Promise = require('bluebird')
const _ = require('lodash')
const addIssue = require('./add_issue')

const { getBaseIssues } = require('../relatedObjects/issues')

module.exports = async function cleanIssueTypes(knex, adminUserName, partnerName) {
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
      const issuesToDelete = await knex('Issue')
        .where({ issueTypeId: issueType.id })
        .select('id as issueId', 'resultId', 'deviceId')
      const filteredResults = _.reduce(
        issuesToDelete,
        (issues, value, key) => {
          if (value.resultId) issues[key] = value.resultId
          return issues
        },
        []
      )
      const filteredDevices = _.reduce(
        issuesToDelete,
        (devices, value, key) => {
          if (value.deviceId) devices[key] = value.deviceId
          return devices
        },
        []
      )
      await knex('Notification')
        .whereIn(
          'issueId',
          _.map(issuesToDelete, issue => issue.issueId)
        )
        .delete()
      await knex('EmailMessage').whereIn('resultId', filteredResults).orWhereIn('deviceId', filteredDevices).delete()
      await knex('AlertMessage').whereIn('resultId', filteredResults).orWhereIn('deviceId', filteredDevices).delete()
      await knex('SmsMessage').whereIn('resultId', filteredResults).orWhereIn('deviceId', filteredDevices).delete()
      await knex('PushNotificationMessage')
        .whereIn('resultId', filteredResults)
        .orWhereIn('deviceId', filteredDevices)
        .delete()
      await knex('WebhookMessage').whereIn('resultId', filteredResults).orWhereIn('deviceId', filteredDevices).delete()
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

  await Promise.each(Object.values(configuredIssues), async externalId =>
    addIssue(knex, externalId, [jobFunctionAdminId], partnerName, adminUserName)
  )
}
