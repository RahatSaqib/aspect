module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')
const { addMinutes } = require('date-fns')

const { processUsingDataSourceQuery } = require('../../src/stringTemplate/service')
const {
  messageSeverityToId,
  issueTypeToId,
  allMessageStatusToId,
  allIssueStatusToId,
  allIssueTypeToId,
} = require('../../src/shared/dictionary')
const getPositiveCategoriesExternalIds = require('../../src/resultCategory/service')

const currentMonth = new Date().getMonth()
const canProceed = date => {
  const percentPositiveResultNotified = new Date(date).getMonth() === currentMonth ? 90 : 85
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
  const { partnerId, userId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId', 'p.userId')

  const messageStatuses = await allMessageStatusToId()
  const issueStatuses = await allIssueStatusToId()
  const issueTypes = await allIssueTypeToId()
  const issueTypeId = issueTypes.ResultReceived
  await seedIssueTypeTemplates(knex, 'ResultReceived', { partnerId, userId })

  const { alertTemplate, emailTemplate, smsTemplate, messageTypeId } = await getPositiveResultIssueProps(
    knex,
    issueTypeId
  )
  // get notificationTypeId
  const { id: notificationTypeId } = await knex('NotificationType')
    .where({
      partnerId,
      issueTypeId,
      messageTypeId,
    })
    .first()

  const persons = await knex('NotificationType as nt')
    .join('Job as j', 'nt.jobFunctionId', 'j.jobFunctionId')
    .join('Person as p', 'j.personId', 'p.Id')
    .where('nt.partnerId', partnerId)
    .where('nt.issueTypeId', issueTypeId)
    .where('nt.messageTypeId', messageTypeId)
    .select('p.id as personId', 'p.name as personName')

  // get all positive results for last 2 months and randomly 'send' email/sms
  // Notice that here we use same query as sub-query for widget 'Positive Results Notified' (externalId: 'gxPositiveResultsNotified') but
  // without few parts
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
    .leftOuterJoin('DeviceApproval as deviceApproval', 'd.deviceApprovalId', 'deviceApproval.id')
    .whereIn('rc.externalid', getPositiveCategoriesExternalIds())
    .whereRaw(
      `
      (
        (
          r.endedOn>= DATE_FORMAT(NOW(),"%Y-%m-01")
        )
        OR
        (
          r.endedOn>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
          AND r.endedOn< DATE_FORMAT(NOW(),"%Y-%m-01")
        )
      )
      `
    )
    .where(function () {
      this.where('deviceApproval.token', 'approved').orWhereNull('deviceApproval.token')
    })
    .select(
      'r.id as resultId',
      'r.deviceId',
      'r.endedOn as resultEndedOn',
      'r.patientData as resultPatientData',
      'd.name as deviceName',
      'r.endedOn',
      'd.siteId',
      's.partnerId',
      's.geographyId',
      'r.assayId',
      'i.id as issueId',
      'it.externalId as issueType',
      'dt.externalId as deviceType'
    )

  await Promise.each(positiveResults, async result => {
    const date = addMinutes(result.endedOn, _.random(140))
    let issueId
    if (!result.issueId) {
      // if result doesn't have an Issue defined - insert issue with
      // issue type 'PositiveResultReceived' and status 'Active'
      ;[issueId] = await knex('Issue').insert({
        issueTypeId,
        issueStatusId: issueStatuses.Active,
        deviceId: result.deviceId,
        siteId: result.siteId,
        geographyId: result.geographyId,
        resultId: result.resultId, // <-- important
        createdOn: date,
        updatedOn: date,
        level: 1,
        partnerId,
      })
    }

    if (!canProceed(date)) {
      return
    }

    const sendSms = _.random(100) < 90

    await Promise.each(persons, async ({ personId, personName }) => {
      const resultData = { ...result, personName }
      const sharedMessageProperties = {
        messageStatusId: messageStatuses.Sent,
        personId,
        siteId: result.siteId,
        deviceId: result.deviceId,
        resultId: result.resultId,
        createdOn: date,
        updatedOn: date,
      }

      let alertMessageId
      let emailMessageId
      let smsMessageId

      if (alertTemplate) {
        ;[alertMessageId] = await knex('AlertMessage').insert({
          alertTemplateId: alertTemplate.id,
          message: await getMessage(resultData, alertTemplate.message),
          ...sharedMessageProperties,
        })
      }

      if (emailTemplate) {
        ;[emailMessageId] = await knex('EmailMessage').insert({
          emailTemplateId: emailTemplate.id,
          subject: await getMessage(resultData, emailTemplate.subject),
          body: await getMessage(resultData, emailTemplate.body),
          htmlBody: await getMessage(resultData, emailTemplate.htmlBody),
          ...sharedMessageProperties,
        })
      }

      if (sendSms && smsTemplate) {
        ;[smsMessageId] = await knex('SmsMessage').insert({
          smsTemplateId: smsTemplate.id,
          message: await getMessage(resultData, smsTemplate.message),
          ...sharedMessageProperties,
        })
      }

      // if at least one message defined - add a Notification
      if (alertMessageId || emailMessageId || smsMessageId) {
        await knex('Notification').insert({
          notificationTypeId,
          issueId,
          personId,
          alertMessageId,
          emailMessageId,
          smsMessageId,
          createdOn: date,
        })
      }
    })
  })
}

async function getPositiveResultIssueProps(knex, issueTypeId) {
  const baseQuery = knex('IssueType as it')
    .innerJoin('MessageType as mt', 'it.defaultMessageTypeId', 'mt.id')
    .where('it.id', issueTypeId)

  const [{ messageTypeId }] = await baseQuery.clone().select('mt.id as messageTypeId')
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
async function seedIssueTypeTemplates(knex, issueTypeExternalId, { partnerId, userId }) {
  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  }
  const messageSeverityId = await messageSeverityToId('Alert')
  const issueTypeId = await issueTypeToId(issueTypeExternalId)
  const { id: jobFunctionId } = await knex('JobFunction')
    .where({ partnerId })
    .whereIn('externalId', ['manager', 'regionalOfficer'])
    .first('id')

  // only Result 1 positive - send email and sms
  const result1PositiveMessage =
    'Dear {{person.name}},\nThis is a positive result notification for {{ result.patient.id }} processed on {{ result.endedOn }} at {{ device.name }}'
  const [result1PositiveEmailTemplateId] = await knex('EmailTemplate').insert({
    subject: 'Positive Result',
    body: result1PositiveMessage,
    htmlBody: result1PositiveMessage.replace('\n', '<br/>'),
    ...auditFields,
  })
  const [result1PositiveSmsTemplateId] = await knex('SmsTemplate').insert({
    message: result1PositiveMessage,
    ...auditFields,
  })
  const [resul1PositiveMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId,
    emailTemplateId: result1PositiveEmailTemplateId,
    smsTemplateId: result1PositiveSmsTemplateId,
  })
  // set defaultMessageTypeId in IssueType to have both email and sms templates defined
  await knex('IssueType').where('id', issueTypeId).update({ defaultMessageTypeId: resul1PositiveMessageTypeId })

  await knex('NotificationType').insert({
    partnerId,
    issueTypeId,
    jobFunctionId,
    level: 2,
    canAcknowledge: 0,
    messageTypeId: resul1PositiveMessageTypeId,
    name: 'Positive Result',
    ...auditFields,
    sendToContactsWithMatchingTags: 0,
  })
}
