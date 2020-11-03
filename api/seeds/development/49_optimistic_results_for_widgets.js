module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')

const { addIssueTypes } = require('../relativeObjectsSeeds')
const {
  seedIssueEventTriggersForPartner,
  seedIssueEscalationTriggersForPartner,
  upsertSingle,
  uniqueKeys,
} = require('../utils')
const {
  generateResults,
  normalizeTreatmentStatusDistributionByResults,
} = require('../commonGenerateResults')
const {
  processUsingDataSourceQuery,
} = require('../../src/stringTemplate/service')
const {
  messageSeverityToId,
  issueTypeToId,
  allMessageStatusToId,
  allIssueStatusToId,
  allIssueTypeToId,
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
    new Date(date).getMonth() === currentMonth ? 75 : 60
  return _.random(0, 100) <= percentPositiveResultNotified
}
const getMessage = async (result, messageTemplate) => {
  const { message } = await processUsingDataSourceQuery(
    {
      ...result,
      messageTemplate,
    },
    ['messageTemplate'],
    {
      dynamic: true,
    }
  )
  return message
}

async function seed(knex) {
  const { partnerId, userId, personId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId', 'p.userId', 'p.id as personId')

  const messageStatuses = await allMessageStatusToId()
  const issueStatuses = await allIssueStatusToId()
  const issueTypes = await allIssueTypeToId()
  //
  const consumableByAssay = await knex('ConsumableAssay')
    .select()
    .then(items =>
      items.reduce((memo, { consumableId, assayId }) => {
        memo[assayId] = consumableId
        return memo
      }, {})
    )

  const issueTypeId = issueTypes.ResultReceived
  await seedIssueTypeForMtb(knex, 'ResultReceived', { partnerId, userId })

  const results = await generateResults(
    knex,
    userId,
    partnerId,
    patients,
    errorCodes,
    'US',
    true,
    300, // resultMtbNumber = 20,
    100 // resultHivVlNumber = 20,
  )
  // generate random treatment
  await normalizeTreatmentStatusDistributionByResults(knex, results)

  const {
    alertTemplate,
    emailTemplate,
    smsTemplate,
    messageTypeId,
  } = await getPositiveResultIssueProps(knex, issueTypeId)
  // get notificationTypeId
  const { id: notificationTypeId } = await knex('NotificationType')
    .where({
      partnerId,
      issueTypeId,
      messageTypeId,
    })
    .first()

  // get all positive results for last 2 months and randomly 'send' email/sms
  // Notice that here we use same query as sub-query for widget 'Positive Results Notified' (externalId: 'gxPositiveResultsNotified') but
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
    // additional joins to get job persons to send email/sms to
    .leftOuterJoin('NotificationType as nt', function () {
      this.on('nt.partnerId', partnerId)
        .andOn('nt.issueTypeId', issueTypeId)
        .andOn('nt.messageTypeId', messageTypeId)
    })
    .leftOuterJoin('Job as job', 'nt.jobFunctionId', 'job.jobFunctionId')
    .leftJoin('Person as jobperson', 'job.personId', 'jobperson.Id')
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
      'r.endedOn as resultEndedOn',
      'r.patientData as resultPatientData',
      'd.name as deviceName',
      'r.endedOn',
      'd.siteId',
      'jobperson.name as personName',
      's.partnerId',
      's.geographyId',
      'r.assayId',
      'i.id as issueId',
      'it.externalId as issueType',
      'dt.externalId as deviceType'
    )

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

    if (alertTemplate && canProceed(date)) {
      ;[{ id: alertMessageId }] = [
        await upsertSingle(
          knex,
          'AlertMessage',
          ['alertTemplateId', ...sharedWhere],
          {
            alertTemplateId: alertTemplate.id,
            message: await getMessage(r, alertTemplate.message),
            ...sharedMessageProperties,
          }
        ),
      ]
    }

    if (emailTemplate && canProceed(date)) {
      ;[{ id: emailMessageId }] = [
        await upsertSingle(
          knex,
          'EmailMessage',
          ['emailTemplateId', ...sharedWhere],
          {
            emailTemplateId: emailTemplate.id,
            subject: await getMessage(r, smsTemplate.subject),
            body: await getMessage(r, smsTemplate.body),
            htmlBody: await getMessage(r, smsTemplate.htmlBody),
            ...sharedMessageProperties,
          }
        ),
      ]
    }

    if (smsTemplate && canProceed(date)) {
      ;[{ id: smsMessageId }] = [
        await upsertSingle(
          knex,
          'SmsMessage',
          ['smsTemplateId', ...sharedWhere],
          {
            smsTemplateId: smsTemplate.id,
            message: await getMessage(r, smsTemplate.message),
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

async function getPositiveResultIssueProps(knex, issueTypeId) {
  const baseQuery = knex('IssueType as it')
    .innerJoin('MessageType as mt', 'it.defaultMessageTypeId', 'mt.id')
    .where('it.id', issueTypeId)
  //
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

  return {
    alertTemplate,
    emailTemplate,
    smsTemplate,
    messageTypeId,
  }
}

// ***********************************************************************
async function seedIssueTypeForMtb(
  knex,
  issueTypeExternalId,
  { partnerId, userId }
) {
  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  }

  // -----------------
  // local helpers
  const upsert = async (tableName, data) =>
    upsertSingle(knex, tableName, uniqueKeys[tableName], data)
  // -----------------

  // seed the issue type itself
  await addIssueTypes(knex, partnerId, userId, [issueTypeExternalId])

  // seed issue event trigger
  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: [issueTypeExternalId],
  })

  // use escalation triggers to notify about new MTB+ Rif- and MTB+ Rif+ results:
  await seedIssueEscalationTriggersForPartner(knex, partnerId, [
    'ResultCategory1DetectedResultCategory2NotDetected',
    'ResultCategory1DetectedResultCategory2Detected',
  ])

  const messageSeverityId = await messageSeverityToId('Alert')
  const issueTypeId = await issueTypeToId(issueTypeExternalId)
  const { id: jobFunctionId } = await knex('JobFunction')
    .where('externalId', 'regionalOfficer')
    .first('id')

  // Result 1 positive only via email.
  const result1PositiveMessage =
    'Dear {{person.name}},\nThis is a Positive GeneXpert MTB detected notification for {{ result.patient.id }} processed on {{ result.endedOn }} at {{ device.name }}'
  const { id: result1PositiveEmailTemplateId } = await upsert('EmailTemplate', {
    subject: 'MTB+ Result',
    body: result1PositiveMessage,
    htmlBody: result1PositiveMessage.replace('\n', '<br/>'),
    ...auditFields,
  })
  const { id: resul1PositiveMessageTypeId } = await upsert('MessageType', {
    messageSeverityId,
    emailTemplateId: result1PositiveEmailTemplateId,
  })

  await upsert('NotificationType', {
    partnerId,
    issueTypeId,
    jobFunctionId,
    level: 2,
    canAcknowledge: 0,
    messageTypeId: resul1PositiveMessageTypeId,
    name: 'MTB+ Result',
    ...auditFields,
    sendToContactsWithMatchingTags: 0,
  })

  // If 1 and 2 positive, email and sms
  const result2PositiveMessage =
    'Dear {{person.name}},\nThis is a Positive GeneXpert MTB detected, RIF Resistance Detected notification for {{ result.patient.id }} processed on {{ result.endedOn }} at {{ device.name }}'
  const { id: result2PositiveEmailTemplateId } = await upsert('EmailTemplate', {
    subject: 'MTB+ RIF+ Result',
    body: result2PositiveMessage,
    htmlBody: result2PositiveMessage.replace('\n', '<br/>'),
    ...auditFields,
  })
  const { id: result2PositiveSmsTemplateId } = await upsert('SmsTemplate', {
    message: result2PositiveMessage,
    ...auditFields,
  })

  const { id: resul2PositiveMessageTypeId } = await upsert('MessageType', {
    messageSeverityId,
    emailTemplateId: result2PositiveEmailTemplateId,
    smsTemplateId: result2PositiveSmsTemplateId,
  })
  // set defaultMessageTypeId in IssueType to have both email and sms templates defined
  await knex('IssueType')
    .where('id', issueTypeId)
    .update({ defaultMessageTypeId: resul2PositiveMessageTypeId })

  await upsert('NotificationType', {
    partnerId,
    issueTypeId,
    jobFunctionId,
    level: 3,
    canAcknowledge: 0,
    messageTypeId: resul2PositiveMessageTypeId,
    name: 'MTB+ Rif+ Result',
    ...auditFields,
    sendToContactsWithMatchingTags: 0,
  })
}
