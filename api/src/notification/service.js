const Boom = require('@hapi/boom')
const _ = require('lodash')
const Promise = require('bluebird')
const {
  knex,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
  transact,
} = require('../db')
const { getUser } = require('../auth/service')
const {
  getJobConstraints,
  addConstraints,
  getConstraints,
} = require('../auth/constraints')
const { notificationCreated } = require('./actions')
const { alertMessageCreated } = require('../alert/actions')
const { emailMessageCreated } = require('../email/actions')
const { smsMessageCreated } = require('../sms/actions')
const { webhookMessageCreated } = require('../webhook/actions')
const {
  fileContentTypeToId,
  messageStatusToId,
  messageSeverityToId,
  notificationTypeCategoryToId,
} = require('../shared/dictionary')

async function listNotifications(request) {
  const { query, auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const notificationQuery = knex('Notification as n')
    .innerJoin('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
    .leftJoin('MessageType as m', 'm.id', 'nt.messageTypeId')
    .leftJoin('Partner as p', 'nt.partnerId', 'p.id')
    .modify(filterParams, query, {})
    .modify(filterDateRangeParams, query, 'lastTriggeredOn')
    .modify(addConstraints, dataConstraints, { partner: 'p' })

  const getItems = notificationQuery
    .clone()
    .leftJoin('Job as j', 'nt.jobFunctionId', 'j.JobfunctionId')
    .leftJoin('Person as per', 'j.personId', 'per.id')
    .select(
      'n.notificationTypeId as id',
      'nt.name',
      knex.raw('count(distinct n.issueId) as totalTriggers'),
      columnCount('alert'),
      knex.raw('COUNT(DISTINCT per.id) as contactsCount'),
      knex.raw(
        "SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT per.`name`),',',5) as contacts"
      )
    )
    .max('n.createdOn as lastTriggeredOn')
    .groupBy('nt.name')
    .modify(sortPageParams, query, 'nt.name')
    .modify(filterParams, query, {
      notificationName: 'nt.name',
    })

  function columnCount(column) {
    return knex.raw(
      `CASE
        WHEN m.${column}TemplateId IS NULL
        THEN null
        ELSE SUM(CASE WHEN n.${column}MessageId IS NULL THEN 0 ELSE 1 END) END as ${column}Count`
    )
  }

  const getCount = knex
    .count('* as count')
    .from(getItems.clone().as('mainQuery'))
    .first()

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { ok: true, total, data, length: data.length }
}

async function onIssueEscalated({ issueId }, { messageContext: context }) {
  await context.transact(async knex => {
    const now = new Date()
    // Find escalation policy for the issue
    const policies = await getEscalationPolicy(knex, issueId)
    // for each job function, find all policies with maximum constrained level,
    // since we are ordered by, max level at first position and filter all with same
    let jobFunctionId = null
    let jobFunctionLevel = null
    await Promise.each(policies, async policy => {
      if (_.isNil(policy.jobFunctionId)) {
        await createNotificationIfNotCreatedAlready(
          { issueId, policy, now },
          { messageContext: context, knex }
        )
      } else {
        if (policy.jobFunctionId !== jobFunctionId) {
          ;({ jobFunctionId, level: jobFunctionLevel } = policy)
        } else if (policy.level !== jobFunctionLevel) {
          // This is a lower level for this particular job function
          // continue until we get to end of list or new job function
          /* eslint-disable no-continue */
          return Promise.resolve()
        }
        const tags = await getTagsByPolicy(knex, policy)
        const people = await getPeopleToNotify(knex, policy, tags)
        await sendIssueNotificationsToPeople(
          knex,
          context,
          people,
          policy,
          issueId
        )
      }
    })
  })
}

async function getTagsByPolicy(txKnex, policy) {
  const notificationTypeTagIds = policy.sendToContactsWithMatchingTags
    ? await txKnex('NotificationTypeTag')
        .where({ notificationTypeId: policy.id })
        .pluck('tagId')
    : []
  const siteTagIds =
    policy.sendToContactsWithMatchingTags && policy.siteId
      ? await txKnex('SiteTag').where({ siteId: policy.siteId }).pluck('tagId')
      : []
  const deviceTagIds =
    policy.sendToContactsWithMatchingTags && policy.deviceId
      ? await txKnex('DeviceTag')
          .where({ deviceId: policy.deviceId })
          .pluck('tagId')
      : []
  const resultTagIds =
    policy.sendToContactsWithMatchingTags && policy.resultId
      ? await txKnex('ResultTag')
          .where({ resultId: policy.resultId })
          .pluck('tagId')
      : []
  return [
    ...notificationTypeTagIds,
    ...siteTagIds,
    ...deviceTagIds,
    ...resultTagIds,
  ]
}

async function getEscalationPolicy(txknex, issueId) {
  return txknex('NotificationType as nt')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('Issue as i', function () {
      // If issue is escalated past configured level, send again
      // on escalation to maximum configured level
      this.on('i.issueTypeId', 'nt.issueTypeId')
        .andOn('i.partnerId', 'nt.partnerId')
        .andOn('i.level', '>=', 'nt.level')
    })
    .leftJoin('Geography as g', 'i.geographyId', 'g.id')
    .where({ 'i.id': issueId })
    .orderBy('nt.jobFunctionId', 'DESC')
    .orderBy('nt.level', 'DESC')
    .select(
      'nt.id',
      'nt.jobFunctionId',
      'nt.level',
      'nt.sendToContactsWithMatchingTags',
      'i.siteId',
      'i.deviceId',
      'i.resultId',
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      'mt.alertTemplateId',
      'mt.emailTemplateId',
      'mt.smsTemplateId',
      'mt.webhookTemplateId'
    )
}

async function getPeopleToNotify(txKnex, policy, tags) {
  return txKnex('Job as j')
    .join('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .modify(queryBuilder => {
      if (policy.sendToContactsWithMatchingTags) {
        queryBuilder
          .join('PersonTag as pt', 'j.personId', 'pt.personId')
          .whereIn('pt.tagId', _.uniq(tags))
      }
      queryBuilder.where('jf.id', policy.jobFunctionId)
    })
    .distinct('j.personId as id')
}

async function sendIssueNotificationsToPeople(
  txKnex,
  context,
  people,
  policy,
  issueId
) {
  const now = new Date()
  // Issue notification to every person assigned, (subscriber will create as necessary)
  await Promise.all(
    people.map(async person => {
      const issuePermitted = await shouldNotifyIssue(
        txKnex,
        issueId,
        person.id,
        policy.jobFunctionId
      )
      if (issuePermitted != null) {
        await createNotificationIfNotCreatedAlready(
          { issueId, personId: person.id, policy, now },
          { messageContext: context, knex: txKnex }
        )
      }
    })
  )
}

async function shouldNotifyIssue(txKnex, issueId, personId, jobFunctionId) {
  // does person have job context that can see this issue?
  const constraints = await getJobConstraints(personId, jobFunctionId)
  const issue = txKnex('Issue as i')
    .leftJoin('Device as d', 'i.deviceId', 'd.id')
    .leftJoin('Site as s', 'i.siteId', 's.id')
    .leftJoin('Geography as g', 'i.geographyId', 'g.id')
    .leftJoin('Partner as p', 'i.partnerId', 'p.id')
    .modify(addConstraints, constraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      partner: 'p',
      showUnapprovedDevices: true,
      showDecommissionedDevices: true,
    })
    .where({ 'i.id': issueId })
    .first('i.id')
  return issue
}

async function createNotificationIfNotCreatedAlready(
  { issueId, personId = null, policy, now = new Date() },
  { messageContext: context, knex }
) {
  context.bindActionCreators({
    notificationCreated,
    alertMessageCreated,
    emailMessageCreated,
    smsMessageCreated,
    webhookMessageCreated,
  })
  const notification = { issueId, notificationTypeId: policy.id, personId }
  const existingNotification = await knex('Notification')
    .where(notification)
    .first()
  if (!existingNotification) {
    notification.createdOn = now
    const messageStatusId = await messageStatusToId('Initial')
    const sharedMessageProperties = {
      messageStatusId,
      personId,
      siteId: policy.siteId,
      deviceId: policy.deviceId,
      resultId: policy.resultId,
      createdOn: now,
      updatedOn: now,
    }

    if (personId) {
      if (policy.alertTemplateId != null) {
        const [alertMessageId] = await knex('AlertMessage').insert({
          alertTemplateId: policy.alertTemplateId,
          ...sharedMessageProperties,
        })
        notification.alertMessageId = alertMessageId
        context.alertMessageCreated(alertMessageId)
      }
    }

    if (policy.emailTemplateId != null) {
      const [emailMessageId] = await knex('EmailMessage').insert({
        emailTemplateId: policy.emailTemplateId,
        ...sharedMessageProperties,
      })
      notification.emailMessageId = emailMessageId
      context.emailMessageCreated(emailMessageId)
    }

    if (policy.smsTemplateId != null) {
      const [smsMessageId] = await knex('SmsMessage').insert({
        smsTemplateId: policy.smsTemplateId,
        ...sharedMessageProperties,
      })
      notification.smsMessageId = smsMessageId
      context.smsMessageCreated(smsMessageId)
    }

    if (policy.webhookTemplateId != null) {
      const [webhookMessageId] = await knex('WebhookMessage').insert({
        webhookTemplateId: policy.webhookTemplateId,
        ...sharedMessageProperties,
      })
      notification.webhookMessageId = webhookMessageId
      context.webhookMessageCreated(webhookMessageId)
    }

    const [notificationId] = await knex('Notification').insert(notification)
    context.notificationCreated(notificationId)
  }
}

async function getNotifications(request) {
  const { auth, query, params } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)
  const notificationQuery = knex('Notification as n')
    .innerJoin('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
    .leftJoin('Issue as iss', 'iss.Id', 'n.issueId')
    .leftJoin('Partner as p', 'nt.partnerId', 'p.id')
    .leftJoin('WebhookMessage as wm', 'wm.id', 'n.webhookMessageId')
    .leftJoin('EmailMessage as em', 'em.id', 'n.emailMessageId')
    .leftJoin('SmsMessage as sm', 'sm.id', 'n.smsMessageId')
    .leftJoin('MessageStatus as msem', 'msem.id', 'em.messageStatusId')
    .leftJoin('MessageStatus as mssms', 'mssms.id', 'sm.messageStatusId')
    .leftJoin('MessageStatus as mswm', 'mswm.id', 'wm.messageStatusId')
    .where('n.notificationTypeId', params.notificationTypeId)
    .modify(addConstraints, dataConstraints, { partner: 'p' })

  const getCount = notificationQuery.clone().count('n.issueId as total').first()

  const getNotificationHistory = notificationQuery
    .clone()
    .modify(sortPageParams, query, 'iss.createdOn')
    .select([
      knex.raw(
        'sum(case when mswm.externalId = "Sent" then 1 else 0 end) as webhookSent'
      ),
      knex.raw(
        'sum(case when mssms.externalId = "Sent" then 1 else 0 end) as smsSent'
      ),
      knex.raw(
        'sum(case when msem.externalId = "Sent" then 1 else 0 end) as emailSent'
      ),
      'iss.createdOn as date',
      'n.id',
    ])
    .groupBy('n.issueId')

  const [{ total }, data] = await Promise.all([
    getCount,
    getNotificationHistory,
  ])

  return { ok: true, total, data }
}

async function saveNotificationType({
  id: notificationTypeId,
  partnerId,
  userId,
  payload,
  issueTypeId = null,
}) {
  const isNew = !notificationTypeId
  const fileContentTypeId = await fileContentTypeToId('applicationJson')
  const messageSeverityId = await messageSeverityToId('Alert')
  const notificationTypeCategoryId = await notificationTypeCategoryToId(
    'resultBased'
  )
  const {
    areaItems,
    deviceLevelId,
    jobFunctions,
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
  } = payload
  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  }

  return transact(async knex => {
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

    if (isNew) {
      /**
       * insert base props in NotificationType (without messageTypeId yet)
       */
      ;[notificationTypeId] = await knex('NotificationType').insert({
        notificationTypeCategoryId,
        partnerId,
        issueTypeId,
        level: 1,
        canAcknowledge: 0,
        name,
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
        })
        .where({ id: notificationTypeId })
      ;({ messageTypeId } = await knex('NotificationType')
        .select('messageTypeId')
        .where({ id: notificationTypeId }))
      let { emailTemplateId, smsTemplateId, webHookTemplateId } = await knex(
        'MessageType'
      )
        .where({ id: messageTypeId })
        .select()

      /**
       * EmailTemplate
       */
      if (emailTemplateId) {
        whereClause = { id: emailTemplateId }
        // update or delete
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
        } else {
          await knex('EmailTemplate').where(whereClause).del()
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
        // update or delete
        if (sendSms) {
          await knex('SmsTemplate')
            .update({
              message: smsBody,
              updatedOn: now,
              updatedBy: userId,
            })
            .where(whereClause)
        } else {
          await knex('SmsTemplate').where(whereClause).del()
        }
      } else if (sendSms) {
        ;[smsTemplateId] = await insertSmsTemplate()
      }
      /**
       * WebhookTemplate
       */
      if (webHookTemplateId) {
        whereClause = { id: webHookTemplateId }
        // update or delete
        if (sendWeb) {
          await knex('WebhookTemplate')
            .update({
              payload: webBody,
              url: webUrl,
              updatedOn: now,
              updatedBy: userId,
            })
            .where(whereClause)
        } else {
          await knex('WebhookTemplate').where(whereClause).del()
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
        filterCondition: JSON.stringify({
          areaItems,
          deviceLevelId,
          jobFunctions,
          result,
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

async function saveNotification(request) {
  const { auth, params, payload } = request
  const { id } = params
  const user = await getUser(auth.credentials.name)
  const { partnerId, id: userId } = user
  const { notificationType } = payload

  if (notificationType === 'resultBased') {
    const { ok, notificationTypeId, error } = await saveNotificationType({
      id,
      partnerId,
      userId,
      payload,
    })
    if (!ok) {
      return Boom.internal(`Can not save notification: ${error}`)
    }
    return { ok: true, notificationTypeId }
  }

  return { ok: false, notificationTypeId: -1 }
}

module.exports = {
  listNotifications,
  onIssueEscalated,
  getNotifications,
  shouldNotifyIssue,
  saveNotification,
}
