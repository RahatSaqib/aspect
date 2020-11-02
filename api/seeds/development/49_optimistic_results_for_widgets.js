module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')
const {
  seedIssueType,
  // seedIssueEventTriggersForPartner,
  // seedIssueEscalationTriggersForPartner,
  upsertNotificationTypes,
  upsertSingle,
} = require('../utils')
const {
  generateResults,
  normalizeTreatmentStatusDistributionByResults,
} = require('../commonGenerateResults')
const {
  processUsingDataSourceQuery,
} = require('../../src/stringTemplate/service')
const {
  allMessageStatusToId,
  allIssueStatusToId,
} = require('../../src/shared/dictionary')
const patients = require('./fixtures/patients.json')
const { errorCodes } = require('./fixtures/errorCodes.js')

const positiveResultCategories = [
  'Detected',
  'Trace Detected',
  'MoreThan40',
  'MoreThan150',
  'MoreThan550',
  'MoreThan1000',
  'Resistant',
  'Positive1',
  'Positive2',
  'Positive3',
  'Scanty',
  'PositiveMOTT',
  'PositiveMTB',
  'Positive',
]

const currentMonth = new Date().getMonth()
const canProceed = date => {
  const percentPositiveResultNotified =
    new Date(date).getMonth() === currentMonth ? 80 : 60
  return _.random(0, 100) <= percentPositiveResultNotified
}

async function seed(knex) {
  const { partnerId, userId, personId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId', 'p.userId', 'p.id as personId')
  const auditFields = {
    createdOn: new Date(),
    createdBy: userId,
    updatedOn: new Date(),
    updatedBy: userId,
  }
  const messageStatuses = await allMessageStatusToId()
  const issueStatuses = await allIssueStatusToId()
  //
  const consumableByAssay = await knex('ConsumableAssay')
    .select()
    .then(items =>
      items.reduce((memo, { consumableId, assayId }) => {
        memo[assayId] = consumableId
        return memo
      }, {})
    )

  const partnerOne = await knex('Partner').first()
  const partnerOneId = partnerOne.id
  const results = await generateResults(
    knex,
    userId,
    partnerOneId,
    patients,
    errorCodes,
    'US',
    true,
    300, // resultMtbNumber = 20,
    100 // resultHivVlNumber = 20,
  )
  // generate random treatment
  await normalizeTreatmentStatusDistributionByResults(knex, results)

  // get all positive results for last 2 months -
  // use same query as sub-query for widget 'Positive Results Notified' (externalId: 'gxPositiveResultsNotified') but
  // without few WHERE parts
  const positiveResults = await knex('Result as r')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Partner as p', 'p.id', 's.partnerId')
    .innerJoin('Assay as a', 'a.id', 'r.assayId')
    .innerJoin('ResultCategory as rc', 'rc.id', 'r.resultCategory1')
    .innerJoin('DeviceType as dt', 'dt.id', 'a.deviceTypeId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('Issue as i', 'r.id', 'i.resultId')
    .leftOuterJoin('IssueType as it', 'i.issueTypeId', 'it.id')
    .leftOuterJoin('Notification as n', 'i.id', 'n.issueId')
    .leftOuterJoin('SmsMessage as sm', function () {
      this.on('n.smsMessageId', 'sm.id').andOn('sm.messageStatusId', 3)
    })
    .leftOuterJoin('EmailMessage as em', function () {
      this.on('n.emailMessageId', 'em.id').andOn('em.messageStatusId', 3)
    })
    .leftOuterJoin(
      'DeviceApproval as deviceApproval',
      'd.deviceApprovalId',
      'deviceApproval.id'
    )
    .whereIn('rc.externalid', positiveResultCategories)
    .whereRaw(
      `
      (
        (
          YEAR(r.endedOn) = YEAR(CURRENT_DATE) 
          AND 
          MONTH(r.endedOn) = MONTH(CURRENT_DATE)
        )
        OR
        (
          YEAR(r.endedOn) = YEAR(DATE_ADD(CURRENT_DATE, INTERVAL -1 MONTH))
          AND 
          MONTH(r.endedOn) = MONTH(DATE_ADD(CURRENT_DATE, INTERVAL -1 MONTH))
        )
      )
      `
    )
    .where(function () {
      this.where('deviceApproval.token', 'approved').orWhereNull(
        'deviceApproval.token'
      )
    })
    .select(
      'r.id as resultId',
      'r.deviceId',
      'd.name as deviceName',
      'r.endedOn',
      'd.siteId',
      's.name as siteName',
      's.partnerId',
      's.geographyId',
      'r.assayId',
      'i.id as issueId',
      'it.externalId as issueType',
      'dt.externalId as deviceType'
    )

  // upsert issue type, all templates and messageType
  const issueTypeId = await seedIssueType(knex, 'PositiveResultReceived', {
    userName: 'admin',
  })
  // upsert NotificationType and get templates
  const {
    alertTemplate,
    emailTemplate,
    smsTemplate,
    messageTypeId,
  } = await getPositiveResultIssueProps(knex, {
    auditFields,
    issueTypeId,
    partnerId,
  })
  // get notificationTypeId
  const { id: notificationTypeId } = await knex('NotificationType')
    .where({
      name: 'LU Positive Result',
      partnerId,
      issueTypeId,
      messageTypeId,
    })
    .first()

  // await seedIssueEventTriggersForPartner(knex, partnerId, {
  //   issueTypeWhitelist: ['PositiveResultReceived'],
  // })
  // await seedIssueEscalationTriggersForPartner(knex, partnerId, [
  //   'PositiveResultReceived',
  // ])

  await Promise.each(positiveResults, async r => {
    const date = r.endedOn
    let issueId
    if (!r.issueId) {
      // if result doesn't have an Issue defined - insert issue with
      // issue type 'PositiveResultReceived' and status 'Active'
      ;[issueId] = await knex('Issue').insert({
        issueTypeId,
        issueStatusId: issueStatuses.Active,
        deviceId: r.deviceId,
        siteId: r.siteId,
        geographyId: r.geographyId,
        resultId: r.resultId, // <-- important
        createdOn: date,
        updatedOn: date,
        consumableId: consumableByAssay[r.assayId],
        level: 1,
        partnerId,
      })
    }

    const sharedMessageProperties = {
      messageStatusId: messageStatuses.Sent,
      personId,
      siteId: r.siteId,
      deviceId: r.deviceId,
      resultId: r.resultId,
      createdOn: date,
      updatedOn: date,
    }
    const sharedWhere = ['personId', 'siteId', 'deviceId', 'resultId']

    let alertMessageId
    let emailMessageId
    let smsMessageId

    if (canProceed(date)) {
      const { message } = await processUsingDataSourceQuery(
        { ...r, messageTemplate: alertTemplate.message },
        ['messageTemplate'],
        {
          dynamic: true,
        }
      )
      ;[{ id: alertMessageId }] = [
        await upsertSingle(
          knex,
          'AlertMessage',
          ['alertTemplateId', ...sharedWhere],
          {
            alertTemplateId: alertTemplate.id,
            message,
            ...sharedMessageProperties,
          }
        ),
      ]
    }

    if (canProceed(date)) {
      ;[{ id: emailMessageId }] = [
        await upsertSingle(
          knex,
          'EmailMessage',
          ['emailTemplateId', ...sharedWhere],
          {
            emailTemplateId: emailTemplate.id,
            subject: 'Positive Result',
            body: 'Positive Result',
            htmlBody: 'Positive Result',
            ...sharedMessageProperties,
          }
        ),
      ]
    }

    if (canProceed(date)) {
      const { message } = await processUsingDataSourceQuery(
        { ...r, messageTemplate: smsTemplate.message },
        ['messageTemplate'],
        {
          dynamic: true,
        }
      )
      ;[{ id: smsMessageId }] = [
        await upsertSingle(
          knex,
          'SmsMessage',
          ['smsTemplateId', ...sharedWhere],
          {
            smsTemplateId: smsTemplate.id,
            message,
            ...sharedMessageProperties,
          }
        ),
      ]
    }

    // if at least one message defined - add a Notification
    if (alertMessageId || emailMessageId || smsMessageId) {
      await upsertSingle(
        knex,
        'Notification',
        ['notificationTypeId', 'issueId', 'personId'],
        {
          notificationTypeId,
          issueId,
          personId,
          alertMessageId,
          emailMessageId,
          smsMessageId,
          createdOn: date,
        }
      )
    }
  })
}

async function getPositiveResultIssueProps(
  knex,
  { auditFields, issueTypeId, partnerId }
) {
  const baseQuery = knex('IssueType as it')
    .innerJoin('MessageType as mt', 'it.defaultMessageTypeId', 'mt.id')
    .where('it.id', issueTypeId)
  const [{ messageTypeId }] = await baseQuery
    .clone()
    .select('mt.id as messageTypeId')
  const [alertTemplate] = await baseQuery
    .clone()
    .innerJoin('AlertTemplate as at', 'mt.alertTemplateId', 'at.id')
    .select('at.*')
  const [emailTemplate] = await baseQuery
    .clone()
    .innerJoin('EmailTemplate as et', 'mt.emailTemplateId', 'et.id')
    .select('et.*')
  const [smsTemplate] = await baseQuery
    .clone()
    .innerJoin('SmsTemplate as st', 'mt.smsTemplateId', 'st.id')
    .select('st.*')

  const { id: jobFunctionIdRegionalOfficer } = await knex('JobFunction')
    .where('partnerId', partnerId)
    .whereIn('name', ['Regional Officer', 'Manager'])
    .first()

  const { id: jobFunctionIdLabUser } = await knex('JobFunction')
    .where('partnerId', partnerId)
    .whereIn('name', ['Lab User', 'Clinician'])
    .first()

  // ------------
  // NotificationType
  // ------------
  await upsertNotificationTypes(knex, [
    {
      name: 'LU Positive Result',
      partnerId,
      issueTypeId,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId,
      ...auditFields,
    },
    {
      name: 'LU Escalated Positive Result',
      partnerId,
      issueTypeId,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId,
      ...auditFields,
    },
    {
      name: 'LU Positive Result - RO View',
      partnerId,
      issueTypeId,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId,
      ...auditFields,
    },
    {
      name: 'LU Escalated Positive Result - RO View',
      partnerId,
      issueTypeId,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 0,
      messageTypeId,
      ...auditFields,
    },
    {
      name: 'RO Positive Result',
      partnerId,
      issueTypeId,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 1,
      messageTypeId,
      ...auditFields,
    },
  ])

  return {
    alertTemplate,
    emailTemplate,
    smsTemplate,
    messageTypeId,
  }
}
