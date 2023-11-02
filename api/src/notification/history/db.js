const { knex, sortPageParams, filterParams, filterDateRangeParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')

const getAllNotificationHistory = async (dataConstraints, query) => {
  let updatedQuery = query
  if (query.notificationWithErrors) updatedQuery = { ...updatedQuery, Error: 'Error' }

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
    .leftOuterJoin('Result as r', 'r.Id', 'n.resultId')
    .leftOuterJoin('Issue as iss', 'iss.id', 'n.issueId')
    .leftJoin('Sample as s', 's.id', 'r.sampleId')
    .leftOuterJoin('Report as rpt', 'rpt.id', 'n.reportId')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .modify(filterDateRangeParams, query, 'n.createdOn')
    .modify(filterParams, updatedQuery, {
      notificationName: 'nt.name',
      notificationTypeName: 'ntc.name',
      notificationTypeCategoryId: 'nt.notificationTypeCategoryId',
      notificationTypeId: 'n.notificationTypeId',
      sampleId: 's.externalId',
      Error: ['mswm.externalId', 'msem.externalId', 'mssms.externalId'],
      reportName: (queryBuilder, value) => {
        queryBuilder.whereRaw(
          `(
          rpt.name LIKE CONCAT('%', ?, '%')
          OR
          rpt.description LIKE CONCAT('%', ?, '%')
        )`,
          [value, value]
        )
      },
    })
    .modify(queryBuilder => {
      if (query.patientId) {
        queryBuilder.where('r.patientData ->> "$.id" LIKE ?', `%${query.patientId}%`)
      }
    })
    .groupBy('n.id')

  const getItems = baseQuery
    .clone()
    .select([
      'n.createdOn as date',
      'ntc.name as notificationTypeName',
      'nt.name as notificationName',
      'r.id as resultId',
      'n.issueId',
      knex.raw(`
      GROUP_CONCAT(DISTINCT CONCAT(pEm.name,'-',msem.i18nKey) SEPARATOR "|") AS emailRecipients
      `),
      knex.raw(`
      GROUP_CONCAT(DISTINCT CONCAT(pSm.name,'-',mssms.i18nKey) SEPARATOR "|") AS smsRecipients
      `),
      knex.raw(`
      GROUP_CONCAT(DISTINCT CONCAT(wm.url,'-',mswebhook.i18nKey) SEPARATOR "|") AS webhookRecipients
      `),
      knex.raw(`
      CASE 
        WHEN ntc.name='Result-Based' THEN 
          JSON_OBJECT(
            'patientId', JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")),
            'sampleId', s.externalId
          )
        WHEN ntc.name='Report-Based' THEN 
          JSON_OBJECT(
            'reportName', rpt.name
          )
        ELSE JSON_OBJECT()
      END as data
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
  const getCount = knex.count('* as count').from(getItems.clone().as('mainQuery')).first()

  getItems.modify(sortPageParams, query, 'n.createdOn')

  return { getCount, getItems }
}

module.exports = {
  getAllNotificationHistory,
}
