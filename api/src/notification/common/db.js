const { knex, filterParams, filterDateRangeParams, sortPageParams, transact } = require('../../db')
const { addConstraints, getConstraints } = require('../../auth/constraints')

const {
  fileContentTypeToId,
  messageSeverityToId,
  notificationTypeCategoryToId,
  issueTypeToId,
} = require('../../shared/dictionary')
const { validateFilterCondition } = require('./validations')

async function updateNotificationType(id, fieldsToUpdate) {
  await knex('NotificationType').where({ id }).update(fieldsToUpdate)
}

async function getNotification(
  id,
  selectFields = [
    'ntc.name as notificationTypeName',
    'ntc.externalId as notificationType',
    'it.externalId as issueType',
    'r.externalId as reportId',
    'nt.name as name',
    'nt.filterCondition as filterCondition',
    'et.subject as emailSubject',
    'et.body as emailBody',
    'st.message as smsBody',
    'wt.url as webUrl',
    'wt.payload as webBody',
    'nt.enabled',
    'nt.cronRecurrency',
  ]
) {
  return knex
    .select(selectFields)
    .from('NotificationType as nt')
    .innerJoin('NotificationTypeCategory as ntc', 'nt.notificationTypeCategoryId', 'ntc.id')
    .leftJoin('MessageType as mt', 'mt.id', 'nt.messageTypeId')
    .leftJoin('IssueType as it', 'it.id', 'nt.issueTypeId')
    .leftJoin('Report as r', 'r.id', 'nt.reportId')
    .leftJoin('EmailTemplate as et', 'et.id', 'mt.emailTemplateId')
    .leftJoin('SmsTemplate as st', 'st.id', 'mt.smsTemplateId')
    .leftJoin('WebhookTemplate as wt', 'wt.id', 'mt.webhookTemplateId')
    .where('nt.id', id)
    .first()
}

async function getListNotifications(query, credentials) {
  const subquery = knex('NotificationType as nti')
    .leftOuterJoin('JobFunction AS jf', leftBuilder =>
      leftBuilder.on(
        knex.raw(
          `JSON_SEARCH(
                nti.filterCondition->>'$.jobFunctions[*].jobFunctionId',
                'one',
                jf.id
              ) IS NOT NULL
            `
        )
      )
    )
    .leftOuterJoin('Person AS per', leftBuilder =>
      leftBuilder.on(
        knex.raw(
          ` JSON_SEARCH(
              nti.filterCondition->>'$.persons[*].personId',
              'one',
              per.id
            ) IS NOT NULL`
        )
      )
    )
    .distinct('nti.id AS notificationTypeId', 'per.name AS personName', 'per.id as personId', 'jf.name AS jfName')

  const dataConstraints = await getConstraints(credentials)

  const notificationQuery = knex('NotificationType as nt')
    .innerJoin('NotificationTypeCategory as ntc', 'nt.notificationTypeCategoryId', 'ntc.id')
    .leftOuterJoin(knex.raw('Notification as n FORCE INDEX(notification_createdOn_notificationType_index)'), builder =>
      builder.on('nt.id', 'n.notificationTypeId').andOn(knex.raw('n.alertMessageId is null'))
    )
    .leftOuterJoin('IssueType as it', 'nt.issueTypeId', 'it.id')
    .leftJoin('MessageType as m', 'm.id', 'nt.messageTypeId')
    .leftJoin('Partner as p', 'nt.partnerId', 'p.id')
    .modify(filterParams, query, {
      notificationName: 'nt.name',
    })
    .modify(filterDateRangeParams, query, 'lastTriggeredOn')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .modify(AddNotificationGeographyConstraints, dataConstraints)

    .max('n.createdOn as lastTriggeredOn')
    .groupBy('nt.id')

  const getItems = notificationQuery
    .clone()
    .leftOuterJoin(subquery.as('filters'), 'nt.id', 'filters.notificationTypeId')
    .modify(sortPageParams, query, 'nt.name')
    .select(
      'nt.id as id',
      'nt.name',
      'nt.enabled',
      knex.raw(`count(distinct n.id) as totalTriggers`),
      knex.raw('COUNT(DISTINCT filters.jfName) as jobFunctionsCount'),
      knex.raw(`GROUP_CONCAT(DISTINCT filters.jfName SEPARATOR ', ') as jobFunctions`),
      knex.raw('COUNT(DISTINCT filters.personName) as personsCount'),
      knex.raw(`GROUP_CONCAT(DISTINCT filters.personName SEPARATOR ', ') as persons`),
      columnCount('alert'),
      knex.raw(`nt.filterCondition->>'$.sendToPatient' as sendToPatient`),
      'ntc.externalId as typeCategory',
      'it.readyForNotification'
    )

  function columnCount(column) {
    return knex.raw(
      `SUM(CASE
          WHEN m.${column}TemplateId IS NULL THEN 0
          ELSE CASE WHEN n.${column}MessageId IS NULL THEN 0 ELSE 1 END END) as ${column}Count`
    )
  }

  const getCount = knex.count('* as count').from(notificationQuery.clone().as('mainQuery')).first()

  const [{ count: total }, data] = await Promise.all([getCount, getItems])
  return { ok: true, total, data, length: data.length }
}

function AddNotificationGeographyConstraints(queryBuilder, dataConstraints) {
  queryBuilder.andWhere(qb => {
    const countryConstraints = dataConstraints.$or?.filter(c => c.geography?.countryId) || []

    // If the user has not country-level rights...
    if (!countryConstraints || countryConstraints.length === 0) {
      // ...then apply state, lga, and site level filters.
      // In the contrary, allow seeing all notifications.
      // For this specific query, having a country-level job invalidates all the other jobs.
      const stateConstraints =
        dataConstraints.$or?.filter(c => c.geography?.stateId).map(c => c.geography.stateId) || []
      if (stateConstraints.length > 0) {
        stateConstraints.map(stateId =>
          qb.orWhere(b => {
            b.where(knex.raw('nt.filterCondition ->> "$.deviceLevelId"'), 'state')
            b.whereRaw(`'${stateId}' MEMBER OF(nt.filterCondition ->> "$.areaItems[*].value")`)
          })
        )
      }

      const lgaConstraints = dataConstraints.$or?.filter(c => c.geography?.lgaId).map(c => c.geography.lgaId) || []
      if (lgaConstraints.length > 0) {
        lgaConstraints.map(lgaId =>
          qb.orWhere(b => {
            b.where(knex.raw('nt.filterCondition ->> "$.deviceLevelId"'), 'lga')
            b.whereRaw(`'${lgaId}' MEMBER OF(nt.filterCondition ->> "$.areaItems[*].value")`)
          })
        )
      }

      const siteConstraints = dataConstraints.$or?.filter(c => c.site).map(c => c.site.id) || []
      if (siteConstraints.length > 0) {
        siteConstraints.map(siteId =>
          qb.orWhere(b => {
            b.where(knex.raw('nt.filterCondition ->> "$.deviceLevelId"'), 'lab')
            b.whereRaw(`'${siteId}' MEMBER OF(nt.filterCondition ->> "$.areaItems[*].value")`)
          })
        )
      }
    }
  })
}

async function saveNotificationType({ id: notificationTypeId, partnerId, userId, payload }) {
  const fileContentTypeId = await fileContentTypeToId('applicationJson')
  const messageSeverityId = await messageSeverityToId('Alert')

  const {
    areaItems,
    deviceLevelId,
    jobFunctions,
    persons,
    sendToPatient,
    name,
    result,
    //
    sendEmail,
    emailBody,
    emailSubject,
    //
    sendSms,
    smsBody,
    //
    sendWeb,
    webBody,
    webUrl,
    enabled,
    cronRecurrency,
    reportFrequency,
    reportDateRange,
    reportStartingWeekDay,
    issueType: issueTypeExternalId,
    reportId: reportExternalId,
    notificationType: notificationTypeExternalId,
    resultBasedScope,
  } = payload

  const notificationTypeCategoryId = await notificationTypeCategoryToId(notificationTypeExternalId)

  const issueTypeId = notificationTypeExternalId !== 'issueBased' ? null : await issueTypeToId(issueTypeExternalId)
  const { id: reportId } =
    notificationTypeExternalId !== 'reportBased'
      ? {}
      : reportExternalId
      ? await knex('Report').where({ externalId: reportExternalId }).first()
      : {}
  const now = new Date()

  const auditFields = {
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  }

  return transact(async knex => {
    // TODO: add extra validations for the other filterCondition properties
    const filterConditionValidation = await validateFilterCondition({
      jobFunctions,
      persons,
      sendToPatient,
    })

    if (filterConditionValidation !== true) return filterConditionValidation

    /**
     * helpers
     */
    const insertEmailTemplate = async () =>
      knex('EmailTemplate').insert({
        subject: emailSubject,
        body: emailBody,
        htmlBody: emailBody
          .split('\n')
          .map(line => `<div>${line}</div>`)
          .join(''),
        ...auditFields,
      })

    const insertSmsTemplate = async () =>
      knex('SmsTemplate').insert({
        message: smsBody,
        ...auditFields,
      })
    const insertWebHookTemplate = async () =>
      knex('WebhookTemplate').insert({
        method: 'POST',
        url: webUrl,
        payload: webBody,
        fileContentTypeId,
        ...auditFields,
      })
    let messageTypeId

    if (!notificationTypeId) {
      /**
       * insert base props in NotificationType (without messageTypeId yet)
       */
      ;[notificationTypeId] = await knex('NotificationType').insert({
        notificationTypeCategoryId,
        partnerId,
        issueTypeId,
        reportId,
        cronRecurrency,
        level: 1,
        canAcknowledge: 0,
        name,
        enabled,
        ...auditFields,
      })
      /**
       * create *Template items
       */
      let emailTemplateId = null
      let smsTemplateId = null
      let webHookTemplateId = null
      if (sendEmail) {
        ;[emailTemplateId] = await insertEmailTemplate()
      }
      if (sendSms) {
        ;[smsTemplateId] = await insertSmsTemplate()
      }
      if (sendWeb) {
        ;[webHookTemplateId] = await insertWebHookTemplate()
      }
      /**
       * create MessageType and then put it in NotificationType table with remaining props
       */
      ;[messageTypeId] = await knex('MessageType').insert({
        messageSeverityId,
        emailTemplateId,
        smsTemplateId,
        webHookTemplateId,
      })
    } else {
      let whereClause
      await knex('NotificationType')
        .update({
          name,
          updatedOn: now,
          updatedBy: userId,
          enabled,
          reportId,
          issueTypeId,
          notificationTypeCategoryId,
          cronRecurrency,
        })
        .where({ id: notificationTypeId })
      ;({ messageTypeId } = await knex
        .select('messageTypeId')
        .from('NotificationType')
        .where({ id: notificationTypeId })
        .first())
      let { emailTemplateId, smsTemplateId, webHookTemplateId } = await knex
        .select('emailTemplateId', 'smsTemplateId', 'webHookTemplateId')
        .from('MessageType')
        .where('id', messageTypeId)
        .first()

      /**
       * EmailTemplate
       */
      if (emailTemplateId) {
        whereClause = { id: emailTemplateId }
        // update
        if (sendEmail) {
          await knex('EmailTemplate')
            .where(whereClause)
            .update({
              subject: emailSubject,
              body: emailBody,
              htmlBody: emailBody
                .split('\n')
                .map(line => `<div>${line}</div>`)
                .join(''),
              updatedOn: now,
              updatedBy: userId,
            })
        }
      } else if (sendEmail) {
        // insert
        ;[emailTemplateId] = await insertEmailTemplate()
      }
      /**
       * SmsTemplate
       */
      if (smsTemplateId) {
        whereClause = { id: smsTemplateId }
        // update
        if (sendSms) {
          await knex('SmsTemplate')
            .update({
              message: smsBody,
              updatedOn: now,
              updatedBy: userId,
            })
            .where(whereClause)
        }
      } else if (sendSms) {
        ;[smsTemplateId] = await insertSmsTemplate()
      }
      /**
       * WebhookTemplate
       */
      if (webHookTemplateId) {
        whereClause = { id: webHookTemplateId }
        // update
        if (sendWeb) {
          await knex('WebhookTemplate')
            .update({
              payload: webBody,
              url: webUrl,
              updatedOn: now,
              updatedBy: userId,
            })
            .where(whereClause)
        }
      } else if (sendWeb) {
        ;[webHookTemplateId] = await insertWebHookTemplate()
      }
      //
      await knex('MessageType')
        .update({
          emailTemplateId,
          smsTemplateId,
          webHookTemplateId,
        })
        .where({ id: messageTypeId })
    }

    /**
     * update remaining fields in NotificationType
     */

    await knex('NotificationType')
      .update({
        messageTypeId,
        issueTypeId,
        cronRecurrency,
        reportId,
        filterCondition: JSON.stringify({
          areaItems,
          deviceLevelId,
          jobFunctions,
          persons,
          issueTypeId,
          result,
          sendEmail,
          sendSms,
          sendToPatient,
          sendWeb,
          enabled,
          reportFrequency,
          reportDateRange,
          reportStartingWeekDay,
          resultBasedScope,
        }),
      })
      .where({ id: notificationTypeId })

    return {
      ok: true,
      notificationTypeId,
    }
  }).catch(err => {
    return {
      ok: false,
      error: err.message,
    }
  })
}

async function getReporBasedNotifications() {
  const rbnQuery = knex('NotificationType as nt')
    .innerJoin('NotificationTypeCategory as ntc', 'nt.notificationTypeCategoryId', 'ntc.id')
    .where('ntc.externalId', 'reportBased')
    .where('nt.enabled', 1)
    .whereNotNull('nt.cronRecurrency')
    .select('nt.id', 'nt.name', 'nt.cronRecurrency')

  return rbnQuery
}

async function getNotificationStatusInfo(id) {
  return knex('NotificationType as nt')
    .join('NotificationTypeCategory as ntc', 'ntc.id', 'nt.notificationTypeCategoryId')
    .where('nt.id', id)
    .first(['ntc.externalId as notificationType', 'nt.name', 'nt.enabled', 'nt.cronRecurrency'])
}

module.exports = {
  getListNotifications,
  saveNotificationType,
  getNotification,
  getReporBasedNotifications,
  getNotificationStatusInfo,
  updateNotificationType,
}
