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
    .leftOuterJoin('Person as pr', 'n.personId', 'pr.id')
    .leftOuterJoin('SmsMessage as sm', 'sm.id', 'n.smsMessageId')
    .leftOuterJoin('MessageStatus as mswebhook', 'mswebhook.id', 'wm.messageStatusId')
    .leftOuterJoin('MessageStatus as msem', 'msem.id', 'em.messageStatusId')
    .leftOuterJoin('MessageStatus as mssms', 'mssms.id', 'sm.messageStatusId')
    .leftOuterJoin('MessageStatus as mswm', 'mswm.id', 'wm.messageStatusId')
    .leftOuterJoin('Result as r', 'r.Id', 'n.resultId')
    .leftOuterJoin('Issue as iss', 'iss.id', 'n.issueId')
    .leftOuterJoin('IssueType as isst', 'isst.id', 'iss.issueTypeId')
    .leftJoin('Sample as s', 's.id', 'r.sampleId')
    .leftOuterJoin('Report as rpt', 'rpt.id', 'n.reportId')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .modify(filterDateRangeParams, query, 'n.createdOn')
    .modify(filterParams, updatedQuery, {
      notificationName: 'nt.name',
      notificationTypeName: 'ntc.name',
      issueTypeName: 'isst.name',
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

  const getItems = baseQuery.clone().select([
    'n.createdOn as date',
    'ntc.name as notificationTypeName',
    'nt.name as notificationName',
    'r.id as resultId',
    'n.issueId',
    'pr.name as recepientName',
    'wm.url as webhookRecepient',
    'mswm.externalId as webHookStatus',
    'mssms.externalId as smsStatus',
    'msem.externalId as emailStatus',
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
  const getCount = knex.count('* as count').from(getItems.clone().as('mainQuery')).first()

  getItems.modify(sortPageParams, query, 'n.createdOn')

  return { getCount, getItems }
}

module.exports = {
  getAllNotificationHistory,
}
