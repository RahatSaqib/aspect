const { knex, sortPageParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')

const getNotificationHistory = async (notificationTypeId, dataConstraints, query) => {
  const { externalId: category } = await knex('NotificationType as nt')
    .innerJoin('NotificationTypeCategory as ntc', 'nt.notificationTypeCategoryId', 'ntc.id')
    .where('nt.id', notificationTypeId)
    .first('ntc.externalId')

  const baseQuery = knex('Notification as n')
    .innerJoin('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
    .innerJoin('NotificationTypeCategory as ntc', 'nt.notificationTypeCategoryId', 'ntc.id')
    .leftOuterJoin('Partner as p', 'nt.partnerId', 'p.id')
    .leftOuterJoin('WebhookMessage as wm', 'wm.id', 'n.webhookMessageId')
    .leftOuterJoin('EmailMessage as em', 'em.id', 'n.emailMessageId')
    .leftOuterJoin('Person as pEm', 'em.personId', 'pEm.id')
    .leftOuterJoin('SmsMessage as sm', 'sm.id', 'n.smsMessageId')
    .leftOuterJoin('Person as pSm', 'sm.personId', 'pSm.id')
    .leftOuterJoin('MessageStatus as mswebhook', 'mswebhook.id', 'wm.messageStatusId')
    .leftOuterJoin('MessageStatus as msem', 'msem.id', 'em.messageStatusId')
    .leftOuterJoin('MessageStatus as mssms', 'mssms.id', 'sm.messageStatusId')
    .leftOuterJoin('MessageStatus as mswm', 'mswm.id', 'wm.messageStatusId')
    .where('n.notificationTypeId', notificationTypeId)
    .modify(addConstraints, dataConstraints, { partner: 'p' })

  let getCount
  let getItems

  switch (category) {
    case 'resultBased': {
      getCount = buildResultBasedNotificationHistoryCount(baseQuery)
      break
    }
    case 'issueBased': {
      getCount = buildIssueBasedNotificationHistoryCount(baseQuery)
      break
    }
    case 'reportBased': {
      getCount = buildReportBasedNotificationHistoryCount(baseQuery)
      break
    }
    default:
      break
  }

  baseQuery
    .modify(sortPageParams, query, 'n.createdOn')
    .select([
      'n.createdOn as date',
      knex.raw(`
      GROUP_CONCAT(DISTINCT CONCAT(pEm.name,'-',msem.externalId) SEPARATOR "|") AS emailRecipients
      `),
      knex.raw(`
      GROUP_CONCAT(DISTINCT CONCAT(pSm.name,'-',mssms.externalId) SEPARATOR "|") AS smsRecipients
      `),
      knex.raw(`
      GROUP_CONCAT(DISTINCT CONCAT(wm.url,'-',mswebhook.externalId) SEPARATOR "|") AS webhookRecipients
      `),
    ])
    .count({
      webhookSent: knex.raw(`
        DISTINCT
        CASE WHEN mswm.externalId = "Sent"
        THEN n.id
        ELSE null END
      `),
      webhookWithErrors: knex.raw(`
        DISTINCT
        CASE WHEN mswm.externalId = "Error"
        THEN n.id
        ELSE null END
      `),
      webhookPending: knex.raw(`
        DISTINCT
        CASE WHEN mswm.externalId = "Pending"
        THEN n.id
        ELSE null END
      `),
      smsSent: knex.raw(`
        DISTINCT
        CASE WHEN mssms.externalId = "Sent"
        THEN n.id
        ELSE null END
      `),
      smsWithErrors: knex.raw(`
        DISTINCT
        CASE WHEN mssms.externalId = "Error"
        THEN n.id
        ELSE null END
      `),
      smsPending: knex.raw(`
        DISTINCT
        CASE WHEN mssms.externalId = "Pending"
        THEN n.id
        ELSE null END
      `),
      emailSent: knex.raw(`
        DISTINCT
        CASE WHEN msem.externalId = "Sent"
        THEN n.id
        ELSE null END
      `),
      emailWithErrors: knex.raw(`
        DISTINCT
        CASE WHEN msem.externalId = "Error"
        THEN n.id
        ELSE null END
      `),
      emailPending: knex.raw(`
        DISTINCT
        CASE WHEN msem.externalId = "Pending"
        THEN n.id
        ELSE null END
      `),
    })

  switch (category) {
    case 'resultBased': {
      getItems = buildResultBasedNotificationHistory(baseQuery)
      break
    }
    case 'issueBased': {
      getItems = buildIssueBasedNotificationHistory(baseQuery)
      break
    }
    case 'reportBased': {
      getItems = buildReportBasedNotificationHistory(baseQuery)
      break
    }
    default:
      break
  }
  return { getItems, getCount }
}

const buildResultBasedNotificationHistoryCount = query => {
  return query
    .clone()
    .leftOuterJoin('Result as r', 'r.Id', 'n.resultId')
    .count({
      total: knex.raw(`DISTINCT n.resultId`),
    })
    .first()
}

const buildReportBasedNotificationHistoryCount = query => {
  return query.clone().leftOuterJoin('Report as r', 'r.id', 'n.reportId').count('n.id as total').first()
}

const buildIssueBasedNotificationHistoryCount = query => {
  return query
    .clone()
    .leftOuterJoin('Issue as iss', 'iss.id', 'n.issueId')
    .leftOuterJoin('Result as r', 'iss.resultId', 'r.id')
    .count({
      total: knex.raw(`DISTINCT n.issueId`),
    })
    .first()
}

const buildResultBasedNotificationHistory = query => {
  return query
    .leftOuterJoin('Result as r', 'r.Id', 'n.resultId')
    .leftJoin('Sample as s', 's.id', 'r.sampleId')
    .select([
      'r.id as resultId',
      's.externalId as sampleId',
      knex.raw(`JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId`),
    ])
    .groupBy('n.resultId')
}

const buildReportBasedNotificationHistory = query => {
  return query.leftOuterJoin('Report as r', 'r.id', 'n.reportId').groupBy('n.id')
}

const buildIssueBasedNotificationHistory = query => {
  return query
    .leftOuterJoin('Issue as iss', 'iss.id', 'n.issueId')
    .leftOuterJoin('Result as r', 'iss.resultId', 'r.id')
    .leftJoin('Sample as s', 's.id', 'r.sampleId')
    .select([
      'iss.resultId',
      'n.issueId',
      's.externalId as sampleId',
      knex.raw(`JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId`),
    ])
    .groupBy('n.issueId')
}

module.exports = {
  getNotificationHistory,
}
