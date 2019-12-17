const _ = require('lodash')
const Promise = require('bluebird')
const {
  knex,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
} = require('../db')
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
const { messageStatusToId } = require('../shared/dictionary')

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
    .select(
      'n.notificationTypeId as id',
      'nt.name',
      knex.raw(
        'SUM(CASE WHEN n.issueId IS NULL then 0 ELSE 1 END) as totalTriggers'
      ),
      columnCount('alert'),
      columnCount('sms'),
      columnCount('email')
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

  const getCount = notificationQuery
    .clone()
    .countDistinct('n.notificationTypeId as count')
    .first()

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { ok: true, total, data, length: data.length }
}

async function onIssueEscalated({ issueId }, { messageContext: context }) {
  await context.transact(async knex => {
    const now = new Date()
    // Find escalation policy for the issue
    const policies = await knex('NotificationType as nt')
      .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
      .join('Issue as i', function() {
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
        const notificationTypeTagIds = policy.sendToContactsWithMatchingTags
          ? await knex('NotificationTypeTag')
              .where({ notificationTypeId: policy.id })
              .pluck('tagId')
          : []
        const siteTagIds =
          policy.sendToContactsWithMatchingTags && policy.siteId
            ? await knex('SiteTag')
                .where({ siteId: policy.siteId })
                .pluck('tagId')
            : []
        const deviceTagIds =
          policy.sendToContactsWithMatchingTags && policy.deviceId
            ? await knex('DeviceTag')
                .where({ deviceId: policy.deviceId })
                .pluck('tagId')
            : []
        const resultTagIds =
          policy.sendToContactsWithMatchingTags && policy.resultId
            ? await knex('ResultTag')
                .where({ resultId: policy.resultId })
                .pluck('tagId')
            : []
        const people = await knex('Job as j')
          .join('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
          .modify(queryBuilder => {
            if (policy.sendToContactsWithMatchingTags) {
              queryBuilder
                .join('PersonTag as pt', 'j.personId', 'pt.personId')
                .whereIn(
                  'pt.tagId',
                  _.uniq([
                    ...notificationTypeTagIds,
                    ...siteTagIds,
                    ...deviceTagIds,
                    ...resultTagIds,
                  ])
                )
            }
            queryBuilder.where('jf.id', policy.jobFunctionId)
          })
          .distinct('j.personId as id')
        // Issue notification to every person assigned, (subscriber will create as necessary)
        await Promise.all(
          people.map(async person => {
            // does person have job context that can see this issue?
            const constraints = await getJobConstraints(
              person.id,
              policy.jobFunctionId
            )
            const issuePermitted = await knex('Issue as i')
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
              })
              .where({ 'i.id': issueId })
              .first('i.id')
            if (issuePermitted != null) {
              await createNotificationIfNotCreatedAlready(
                { issueId, personId: person.id, policy, now },
                { messageContext: context, knex }
              )
            }
          })
        )
      }
    })
  })
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

    if (policy.alertTemplateId != null) {
      const [alertMessageId] = await knex('AlertMessage').insert({
        alertTemplateId: policy.alertTemplateId,
        ...sharedMessageProperties,
      })
      notification.alertMessageId = alertMessageId
      context.alertMessageCreated(alertMessageId)
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

module.exports = {
  listNotifications,
  onIssueEscalated,
}
