module.exports = require('../utils').seed(seed, __filename)

const { allJobFunctionToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where('name', 'Zimbabwe').first('id')
  await knex('Partner').where('name', 'Zimbabwe').update({ maxDaysDeviceOffline: 1, maxDaysDeviceNoResults: 1 })

  const noResultIssueType = await knex('IssueType').where('externalId', 'DeviceNoResults').first()
  const deviceOfflineIssueType = await knex('IssueType').where('externalId', 'DeviceOffline').first()
  const now = new Date()
  const sevenDaysEscalateToLevel2 = {
    partnerId,
    escalateToLevel: 2,
    escalationConditions: JSON.stringify({
      evaluationMethod: 'issue-age',
      evaluationParameter: { days: 7 },
    }),
    createdOn: now,
    updatedOn: now,
  }
  await knex('IssueEscalationTrigger').insert([
    {
      issueTypeId: noResultIssueType.id,
      ...sevenDaysEscalateToLevel2,
    },
    {
      issueTypeId: deviceOfflineIssueType.id,
      ...sevenDaysEscalateToLevel2,
    },
  ])
  const { id: adminId } = await knex('User').where('name', 'admin').first('id')
  const escalationLevel2Notifiction = {
    partnerId,
    level: 2,
    canAcknowledge: false,
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const jobFunctions = await allJobFunctionToId()
  await knex('NotificationType').insert([
    {
      issueTypeId: noResultIssueType.id,
      jobFunctionId: jobFunctions.admin,
      name: 'Send device no results email to Admin after 7 days',
      messageTypeId: noResultIssueType.defaultMessageTypeId,
      ...escalationLevel2Notifiction,
    },
    {
      issueTypeId: noResultIssueType.id,
      jobFunctionId: jobFunctions.ntp,
      name: 'Send device no results email to NTP after 7 days',
      messageTypeId: noResultIssueType.defaultMessageTypeId,
      ...escalationLevel2Notifiction,
    },
    {
      issueTypeId: deviceOfflineIssueType.id,
      jobFunctionId: jobFunctions.admin,
      name: 'Send device offline email to Admin after 7 days',
      messageTypeId: deviceOfflineIssueType.defaultMessageTypeId,
      ...escalationLevel2Notifiction,
    },
    {
      issueTypeId: deviceOfflineIssueType.id,
      jobFunctionId: jobFunctions.ntp,
      name: 'Send device offline email to NTP after 7 days',
      messageTypeId: deviceOfflineIssueType.defaultMessageTypeId,
      ...escalationLevel2Notifiction,
    },
  ])
}
