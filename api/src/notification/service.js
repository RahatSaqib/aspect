const _ = require('lodash')
const Promise = require('bluebird')
const subMinutes = require('date-fns/sub_minutes')
const { getJobConstraints, addConstraints } = require('../auth/constraints')
const { notificationCreated } = require('./actions')
const { alertMessageCreated } = require('../alert/actions')
const { emailMessageCreated } = require('../email/actions')
const { smsMessageCreated } = require('../sms/actions')
const { webhookMessageCreated } = require('../webhook/actions')
const { messageStatusToId } = require('../shared/dictionary')

async function listNotifications(request) {
  const { query } = request
  const now = Date.now()

  const data = _.flowRight(
    x =>
      x.map((it, i) => {
        it.id = i + 1
        return it
      }),
    query.sortDir === 'desc' ? _.reverse : _.identity,
    x => _.sortBy(x, query.sortCol || _.identity)
  )([
    {
      alertType: 'mine',
      alertName: 'TB MTB+ Rif+ in Western Region',
      lastTriggeredOn: subMinutes(now, 0),
      recipientsCount: 4,
      triggersCount: 20,
      errorsCount: 30,
    },
    {
      alertType: 'normal',
      alertName: 'New HIV+ Case',
      lastTriggeredOn: subMinutes(now, 60),
      recipientsCount: 14,
      triggersCount: 7,
      errorsCount: 0,
    },
    {
      alertType: 'normal',
      alertName: 'Inventory about to expire',
      lastTriggeredOn: subMinutes(now, 200),
      recipientsCount: 3,
      triggersCount: 1,
      errorsCount: 0,
    },
    {
      alertType: 'normal',
      alertName: 'New HIV+ Case',
      lastTriggeredOn: subMinutes(now, 345),
      recipientsCount: 7,
      triggersCount: 3,
      errorsCount: 0,
    },
    {
      alertType: 'mine',
      alertName: 'Module swapped',
      lastTriggeredOn: subMinutes(now, 800),
      recipientsCount: 14,
      triggersCount: 7,
      errorsCount: 5,
    },
    {
      alertType: 'mine',
      alertName: 'TB MTB+ Rif+ in Western Region',
      lastTriggeredOn: subMinutes(now, 1202),
      recipientsCount: 3,
      triggersCount: 1,
      errorsCount: 23,
    },
    {
      alertType: 'normal',
      alertName: 'New HIV+ Case',
      lastTriggeredOn: subMinutes(now, 1634),
      recipientsCount: 7,
      triggersCount: 3,
      errorsCount: 0,
    },
    {
      alertType: 'normal',
      alertName: 'Device Offline',
      lastTriggeredOn: subMinutes(now, 1645),
      recipientsCount: 14,
      triggersCount: 7,
      errorsCount: 0,
    },
    {
      alertType: 'normal',
      alertName: 'TB MTB+ Rif+ in Southern Region',
      lastTriggeredOn: subMinutes(now, 2346),
      recipientsCount: 3,
      triggersCount: 1,
      errorsCount: 0,
    },
    {
      alertType: 'normal',
      alertName: 'New HIV+ Case',
      lastTriggeredOn: subMinutes(now, 13457),
      recipientsCount: 7,
      triggersCount: 3,
      errorsCount: 0,
    },
  ])

  const total = data.length

  const result = { ok: true, total, data, length: data.length }

  return result
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
      const [alertMessageId] = await knex('AlertMessage').insert(
        Object.assign(
          {
            alertTemplateId: policy.alertTemplateId,
          },
          sharedMessageProperties
        )
      )
      notification.alertMessageId = alertMessageId
      context.alertMessageCreated(alertMessageId)
    }

    if (policy.emailTemplateId != null) {
      const [emailMessageId] = await knex('EmailMessage').insert(
        Object.assign(
          {
            emailTemplateId: policy.emailTemplateId,
          },
          sharedMessageProperties
        )
      )
      notification.emailMessageId = emailMessageId
      context.emailMessageCreated(emailMessageId)
    }

    if (policy.smsTemplateId != null) {
      const [smsMessageId] = await knex('SmsMessage').insert(
        Object.assign(
          {
            smsTemplateId: policy.smsTemplateId,
          },
          sharedMessageProperties
        )
      )
      notification.smsMessageId = smsMessageId
      context.smsMessageCreated(smsMessageId)
    }

    if (policy.webhookTemplateId != null) {
      const [webhookMessageId] = await knex('WebhookMessage').insert(
        Object.assign(
          {
            webhookTemplateId: policy.webhookTemplateId,
          },
          sharedMessageProperties
        )
      )
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
