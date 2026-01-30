const _ = require('lodash')

const chai = require('chai')

const { assert } = chai
const { deviceTypeToId, deviceApprovalToId } = require('../../src/shared/dictionary')

function ensureMySqlBeforeNestedTablesOptions(knex) {
  assert.equal(
    knex.client.config.client,
    'mysql',
    'The knex query below uses .options({ nestTables: true }) which, at the time of writing, only works when using the MySQL driver (https://github.com/tgriesser/knex/issues/882). If the database has changed, we need to find another way to nest results (possibly using: https://github.com/CoursePark/KnexNest)'
  )
}

async function getPartner(knex, partnerName) {
  return knex('Partner').where('name', partnerName).first()
}

async function getDevice(knex, { countryAbbreviation, partnerId, noResultsSince = null, notIn = [] }) {
  ensureMySqlBeforeNestedTablesOptions(knex)
  return knex('Device as d')
    .join('Site as s', 'd.siteId', 's.id')
    .join('Geography as lgaGeography', 's.geographyId', 'lgaGeography.id')
    .join('Geography as regionalGeography', function () {
      this.on('lgaGeography.stateId', 'regionalGeography.stateId').onNull('regionalGeography.lgaId')
    })
    .join('Country as c', 'lgaGeography.countryId', 'c.id')
    .join('Person as labUser', 'lgaGeography.id', 'labUser.geographyId')
    .join('JobContext as labUserJob', 'labUser.id', 'labUserJob.personId')
    .join('JobFunction as labUserJobFunction', 'labUserJob.jobFunctionId', 'labUserJobFunction.id')
    .join('JobContext as regionalContext', 'regionalGeography.id', 'regionalContext.geographyId')
    .join('JobFunction as regionalOfficerJobFunction', 'regionalContext.jobFunctionId', 'regionalOfficerJobFunction.id')
    .join('Person as regionalOfficer', 'regionalContext.personId', 'regionalOfficer.id')
    .leftJoin('FactDeviceFlag as fdf', 'd.id', 'fdf.deviceId')
    .where({
      'c.abbreviation': countryAbbreviation,
      'd.partnerId': partnerId,
      'labUserJobFunction.name': 'Lab User',
      'regionalOfficerJobFunction.name': 'Regional Officer',
    })
    .modify(queryBuilder => {
      if (!_.isEmpty(notIn)) {
        queryBuilder.whereNotIn('d.id', notIn)
      }
      if (noResultsSince) {
        const resultsAfter = knex('Result as r')
          .where('r.deviceId', 'd.id')
          .andWhere(function () {
            this.where('r.startedOn', '>', noResultsSince)
            this.orWhere('r.endedOn', '>', noResultsSince)
          })
          .limit(1)
          .select()
        queryBuilder.whereRaw(`NOT EXISTS(${resultsAfter.toString()})`)
      }
    })
    .options({ nestTables: true })
    .first()
}

async function getSite(knex, { countryAbbreviation, partnerId }) {
  ensureMySqlBeforeNestedTablesOptions(knex)
  return knex('Site as s')
    .join('Geography as lgaGeography', 's.geographyId', 'lgaGeography.id')
    .join('Geography as regionalGeography', function () {
      this.on('lgaGeography.stateId', 'regionalGeography.stateId').onNull('regionalGeography.lgaId')
    })
    .join('Country as c', 'lgaGeography.countryId', 'c.id')
    .join('Person as labUser', 'lgaGeography.id', 'labUser.geographyId')
    .join('JobContext as labUserJob', 'labUser.id', 'labUserJob.personId')
    .join('JobFunction as labUserJobFunction', 'labUserJob.jobFunctionId', 'labUserJobFunction.id')
    .join('JobContext as regionalContext', 'regionalGeography.id', 'regionalContext.geographyId')
    .join('JobFunction as regionalOfficerJobFunction', 'regionalContext.jobFunctionId', 'regionalOfficerJobFunction.id')
    .join('Person as regionalOfficer', 'regionalContext.personId', 'regionalOfficer.id')
    .where({
      'c.abbreviation': countryAbbreviation,
      's.partnerId': partnerId,
      'labUserJobFunction.name': 'Lab User',
      'regionalOfficerJobFunction.name': 'Regional Officer',
    })
    .options({ nestTables: true })
    .first()
}

async function getDeviceApproval(knex, deviceApprovalToken) {
  return knex('DeviceApproval').where('token', deviceApprovalToken).first()
}

async function getIssueType(knex, issueType) {
  return knex('IssueType').where('externalId', issueType).first()
}

async function getIssueStatus(knex, issueStatus) {
  return knex('IssueStatus').where('externalId', issueStatus).first()
}

async function getIssueEventStatus(knex, issueEventStatus) {
  return knex('IssueEventStatus').where('externalId', issueEventStatus).first()
}

async function getIssue(knex, issueId) {
  return knex('Issue').where('id', issueId).first()
}

async function createAndTriggerIssue({ knex, partnerId, device, issueTypeId, actionType, level, dateIssueRaised }) {
  const activeIssueStatus = await getIssueStatus(knex, 'Active')
  const triggeredIssueEventStatus = await getIssueEventStatus(knex, 'Triggered')
  const [issueId] = await knex('Issue').insert({
    issueTypeId,
    issueStatusId: activeIssueStatus.id,
    partnerId,
    geographyId: device.geographyId,
    deviceId: device.id,
    level,
    createdOn: dateIssueRaised,
    updatedOn: dateIssueRaised,
  })
  await createIssueEvent({
    knex,
    deviceId: device.id,
    issueId,
    issueEventStatusId: triggeredIssueEventStatus.id,
    actionType,
    createdOn: dateIssueRaised,
  })
  return issueId
}

async function createIssueEvent({
  knex,
  deviceId,
  issueId,
  issueEventStatusId,
  actionType,
  createdOn,
  options = null,
}) {
  const issueEvent = {
    issueEventStatusId,
    issueId,
    data: {
      type: actionType,
      deviceId,
    },
    createdOn,
  }
  if (options) {
    issueEvent.data.options = options
  }
  issueEvent.data = JSON.stringify(issueEvent.data)
  return knex('IssueEvent').insert(issueEvent)
}

async function createDeviceNoResult(knex, { countryAbbreviation, partnerId }) {
  // get 1st site for current partner
  const {
    s: { id: siteId },
  } = await getSite(knex, {
    countryAbbreviation,
    partnerId,
  })

  const [deviceId] = await knex('Device').insert({
    partnerId,
    siteId, // new site id
    deviceTypeId: await deviceTypeToId('CepheidGeneXpert'),
    deviceApprovalId: await deviceApprovalToId('approved'),
    name: 'Test Device',
    shortName: 'Test Device',
    lastSeenOn: new Date(),
  })
  return deviceId
}

async function deleteDeviceAndTestData(knex, deviceIds) {
  await knex('FactDeviceFlag').whereIn('deviceId', deviceIds).delete()
  await knex('DeviceApprovalLog').whereIn('deviceId', deviceIds).delete()
  await knex('FactDeviceFlag').whereIn('deviceId', deviceIds).delete()
  await knex('DeviceLog').whereIn('deviceId', deviceIds).delete()
  await knex('DeviceOperation').whereIn('deviceId', deviceIds).delete()
  await knex('Device').whereIn('id', deviceIds).delete()
}

async function cleanUpIssues(knex, issueIds) {
  const notifications = await knex('Notification').whereIn('issueId', issueIds).select()
  const alertMessageIds = _.filter(
    _.uniq(_.map(notifications, 'alertMessageId')),
    alertMessageId => !_.isNull(alertMessageId)
  )
  if (!_.isEmpty(alertMessageIds)) {
    await knex('AlertMessage').whereIn('id', alertMessageIds).del()
  }
  const emailMessageIds = _.filter(
    _.uniq(_.map(notifications, 'emailMessageId')),
    emailMessageId => !_.isNull(emailMessageId)
  )
  if (!_.isEmpty(emailMessageIds)) {
    await knex('EmailMessage').whereIn('id', emailMessageIds).del()
  }
  const smsMessageIds = _.filter(_.uniq(_.map(notifications, 'smsMessageId')), smsMessageId => !_.isNull(smsMessageId))
  if (!_.isEmpty(smsMessageIds)) {
    await knex('SmsMessage').whereIn('id', smsMessageIds).del()
  }
  await knex('Notification').whereIn('issueId', issueIds).del()
  return knex('Issue').whereIn('id', issueIds).del()
}
module.exports = {
  getPartner,
  getDeviceApproval,
  cleanUpIssues,
  deleteDeviceAndTestData,
  createDeviceNoResult,
  createIssueEvent,
  createAndTriggerIssue,
  getIssue,
  getIssueEventStatus,
  getIssueType,
  getDevice,
  getIssueStatus,
}
