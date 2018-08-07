const _ = require('lodash')
const chai = require('chai')

const { assert } = chai

function ensureMySqlBeforeNestedTablesOptions(knex) {
  assert.equal(
    knex.client.config.client,
    'mysql',
    'The knex query below uses .options({ nestTables: true }) which, at the time of writing, only works when using the MySQL driver (https://github.com/tgriesser/knex/issues/882). If the database has changed, we need to find another way to nest results (possibly using: https://github.com/CoursePark/KnexNest)'
  )
}

async function getPartner(knex, partnerName) {
  return knex('Partner')
    .where('name', partnerName)
    .first()
}

async function getSite(
  knex,
  { countryAbbreviation, partnerId, requireInventory = false }
) {
  ensureMySqlBeforeNestedTablesOptions(knex)
  return knex('Site as s')
    .join('Geography as lgaGeography', 's.geographyId', 'lgaGeography.id')
    .join('Geography as regionalGeography', function() {
      this.on('lgaGeography.stateId', 'regionalGeography.stateId').onNull(
        'regionalGeography.lgaId'
      )
    })
    .join('Country as c', 'lgaGeography.countryId', 'c.id')
    .join('Person as labUser', 'lgaGeography.id', 'labUser.geographyId')
    .join('Job as labUserJob', 'labUser.id', 'labUserJob.personId')
    .join(
      'JobFunction as labUserJobFunction',
      'labUserJob.jobFunctionId',
      'labUserJobFunction.id'
    )
    .join(
      'JobContext as regionalContext',
      'regionalGeography.id',
      'regionalContext.geographyId'
    )
    .join(
      'Job as regionalOfficerJob',
      'regionalContext.jobId',
      'regionalOfficerJob.id'
    )
    .join(
      'JobFunction as regionalOfficerJobFunction',
      'regionalOfficerJob.jobFunctionId',
      'regionalOfficerJobFunction.id'
    )
    .join(
      'Person as regionalOfficer',
      'regionalOfficerJob.personId',
      'regionalOfficer.id'
    )
    .leftJoin('InventoryItem as ii', 's.id', 'ii.siteId')
    .where('c.abbreviation', countryAbbreviation)
    .andWhere(function() {
      this.where('s.partnerId', partnerId)
        .andWhere('labUserJobFunction.name', 'Lab User')
        .andWhere('regionalOfficerJobFunction.name', 'Regional Officer')
      if (requireInventory) {
        this.whereNotNull('ii.id')
      }
    })
    .options({ nestTables: true })
    .first()
}

async function getIssueType(knex, issueType) {
  return knex('IssueType')
    .where('externalId', issueType)
    .first()
}

async function getIssueStatus(knex, issueStatus) {
  return knex('IssueStatus')
    .where('externalId', issueStatus)
    .first()
}

async function getIssueEventStatus(knex, issueEventStatus) {
  return knex('IssueEventStatus')
    .where('externalId', issueEventStatus)
    .first()
}

async function getIssue(knex, issueId) {
  return knex('Issue')
    .where('id', issueId)
    .first()
}

async function getIssueNotifications(knex, issueId) {
  ensureMySqlBeforeNestedTablesOptions(knex)
  return knex('Notification')
    .join(
      'NotificationType',
      'Notification.notificationTypeId',
      'NotificationType.id'
    )
    .where('issueId', issueId)
    .options({ nestTables: true })
    .select()
}

async function getNotificationType(
  knex,
  partnerId,
  issueTypeId,
  jobFunctionId,
  level,
  notificationTypeName
) {
  return knex('NotificationType')
    .where({
      partnerId,
      issueTypeId,
      name: notificationTypeName,
      jobFunctionId,
      level,
    })
    .first()
}

async function getJobJunction(knex, partnerId, jobFunctionName) {
  return knex('JobFunction')
    .where({
      partnerId,
      name: jobFunctionName,
    })
    .first()
}

async function createAndTriggerIssueBase({
  knex,
  partnerId,
  geographyId,
  siteId,
  deviceId,
  resultId,
  issueTypeId,
  level,
  dateIssueRaised,
  issueEventPayload,
}) {
  const activeIssueStatus = await getIssueStatus(knex, 'Active')
  const triggeredIssueEventStatus = await getIssueEventStatus(knex, 'Triggered')
  const issueId = await knex('Issue').insert({
    issueTypeId,
    issueStatusId: activeIssueStatus.id,
    partnerId,
    geographyId,
    siteId,
    deviceId,
    resultId,
    level,
    createdOn: dateIssueRaised,
    updatedOn: dateIssueRaised,
  })
  await knex('IssueEvent').insert({
    issueEventStatusId: triggeredIssueEventStatus.id,
    issueId,
    data: JSON.stringify(issueEventPayload),
    createdOn: dateIssueRaised,
  })
  return issueId
}

async function createNotification(
  knex,
  notificationTypeId,
  issueId,
  personId,
  createdOn
) {
  return knex('Notification').insert({
    notificationTypeId,
    issueId,
    personId,
    createdOn,
  })
}

async function cleanUpIssues(knex, issueIds) {
  const notifications = await knex('Notification')
    .whereIn('issueId', issueIds)
    .select()
  const alertMessageIds = _.filter(
    _.uniq(_.map(notifications, 'alertMessageId')),
    alertMessageId => !_.isNull(alertMessageId)
  )
  if (!_.isEmpty(alertMessageIds)) {
    await knex('AlertMessage')
      .whereIn('id', alertMessageIds)
      .del()
  }
  const emailMessageIds = _.filter(
    _.uniq(_.map(notifications, 'emailMessageId')),
    emailMessageId => !_.isNull(emailMessageId)
  )
  if (!_.isEmpty(emailMessageIds)) {
    await knex('EmailMessage')
      .whereIn('id', emailMessageIds)
      .del()
  }
  const smsMessageIds = _.filter(
    _.uniq(_.map(notifications, 'smsMessageId')),
    smsMessageId => !_.isNull(smsMessageId)
  )
  if (!_.isEmpty(smsMessageIds)) {
    await knex('SmsMessage')
      .whereIn('id', smsMessageIds)
      .del()
  }
  await knex('Notification')
    .whereIn('issueId', issueIds)
    .del()
  return knex('Issue')
    .whereIn('id', issueIds)
    .del()
}

module.exports = {
  ensureMySqlBeforeNestedTablesOptions,
  getPartner,
  getSite,
  getIssueType,
  getIssueStatus,
  getIssueEventStatus,
  getIssue,
  getIssueNotifications,
  getNotificationType,
  getJobJunction,
  createAndTriggerIssueBase,
  createNotification,
  cleanUpIssues,
}
