const _ = require('lodash')
const subMinutes = require('date-fns/sub_minutes')
const { notificationCreated } = require('./actions')
const { alertMessageCreated } = require('../alert/actions')
const { emailMessageCreated } = require('../email/actions')
const { smsMessageCreated } = require('../sms/actions')
const { webhookMessageCreated } = require('../webhook/actions')

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
      alertName: 'Alert name',
      lastTriggeredOn: subMinutes(now, 1),
      recipientsCount: 14,
      triggersCount: 7,
      errorsCount: 0,
    },
    {
      alertType: 'normal',
      alertName: 'Alert name',
      lastTriggeredOn: subMinutes(now, 2),
      recipientsCount: 3,
      triggersCount: 1,
      errorsCount: 0,
    },
    {
      alertType: 'normal',
      alertName: 'Alert name',
      lastTriggeredOn: subMinutes(now, 3),
      recipientsCount: 7,
      triggersCount: 3,
      errorsCount: 0,
    },
    {
      alertType: 'mine',
      alertName: 'Alert name',
      lastTriggeredOn: subMinutes(now, 4),
      recipientsCount: 14,
      triggersCount: 7,
      errorsCount: 5,
    },
    {
      alertType: 'mine',
      alertName: 'Alert name',
      lastTriggeredOn: subMinutes(now, 5),
      recipientsCount: 3,
      triggersCount: 1,
      errorsCount: 23,
    },
    {
      alertType: 'normal',
      alertName: 'Alert name',
      lastTriggeredOn: subMinutes(now, 6),
      recipientsCount: 7,
      triggersCount: 3,
      errorsCount: 0,
    },
    {
      alertType: 'normal',
      alertName: 'Alert name',
      lastTriggeredOn: subMinutes(now, 7),
      recipientsCount: 14,
      triggersCount: 7,
      errorsCount: 0,
    },
    {
      alertType: 'normal',
      alertName: 'Alert name',
      lastTriggeredOn: subMinutes(now, 8),
      recipientsCount: 3,
      triggersCount: 1,
      errorsCount: 0,
    },
    {
      alertType: 'normal',
      alertName: 'Alert name',
      lastTriggeredOn: subMinutes(now, 9),
      recipientsCount: 7,
      triggersCount: 3,
      errorsCount: 0,
    },
    {
      alertType: 'normal',
      alertName: 'Alert name',
      lastTriggeredOn: subMinutes(now, 10),
      recipientsCount: 14,
      triggersCount: 7,
      errorsCount: 0,
    },
    {
      alertType: 'normal',
      alertName: 'Alert name',
      lastTriggeredOn: subMinutes(now, 11),
      recipientsCount: 3,
      triggersCount: 1,
      errorsCount: 0,
    },
  ])

  const total = data.length

  const result = { ok: true, total, data, length: data.length }

  return result
}

async function onIssueCreated({ issueId }, context) {
  await onIssueEscalated({ issueId }, context)
}

async function onIssueEscalated({ issueId }, context) {
  context.bindActionCreators({ notificationCreated })
  await context.transact(async knex => {
    const now = new Date()

    // Find escalation policy for the issue
    const policy = await knex('NotificationEscalationPolicy as nep')
      .join('NotificationType as nt', 'nt.id', 'nep.notificationTypeId')
      .join('Issue as i', function() {
        // If issue is escalated past configured level, send again
        // on escalation to maximum configured level
        this.on('i.issueTypeId', 'nt.issueTypeId')
          .andOn('i.partnerId', 'nt.partnerId')
          .andOn('i.level', '>=', 'nep.level')
      })
      .where({ 'i.id': issueId })
      .orderBy('nep.level', 'DESC')
      .first('nep.level', 'nep.jobFunctionId', 'nep.messageTypeId')

    if (policy) {
      const people = await knex('Job as j')
        .join('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
        .where({ 'jf.id': policy.jobFunctionId })
        .select('j.personId as id')
      // FIXME need to limit person by JobContext and Issue deviceId, siteId, etc.

      // Issue notification to every person assigned, (subscriber will create as necessary)
      await Promise.all(
        people.map(async person => {
          const notification = {
            issueId,
            notificationEscalationPolicyId: policy.id,
            personId: person.id,
          }
          const existingNotification = await knex('Notification')
            .where(notification)
            .first()
          if (existingNotification == null) {
            notification.createdOn = now
            const [notificationId] = await knex('Notification').insert(
              notification
            )
            context.notificationCreated(notificationId)
          }
        })
      )
    }
  })
}

async function onIssueResolved(/* { issueId }, context */) {}

async function onNotificationCreated({ notificationId }, context) {
  const now = new Date()
  context.bindActionCreators({
    alertMessageCreated,
    emailMessageCreated,
    smsMessageCreated,
    webhookMessageCreated,
  })
  await context.transact(async knex => {
    const existingLog = await knex('NotificationLog')
      .where({ notificationId })
      .first()
    if (existingLog == null) {
      const {
        personId,
        alertTemplateId,
        emailTemplateId,
        smsTemplateId,
        webhookTemplateId,
      } = await knex('Notification as n')
        .join(
          'NotificationEscalationPolicy as nep',
          'n.notificationEscalationPolicyId',
          'nep.id'
        )
        .join('MessageType as mt', 'nep.messageTypeId', 'mt.id')
        .where({ 'n.id': notificationId })
        .first(
          'n.personId',
          'mt.alertTemplateId',
          'mt.emailTemplateId',
          'mt.smsTemplateId',
          'mt.webhookTemplateId'
        )

      const { messageStatusId } = await knex('MessageStatus')
        .where({ externalId: 'Initial' })
        .first()

      const sharedMessageProperties = {
        personId,
        messageStatusId,
        createdOn: now,
        updatedOn: now,
      }

      let alertMessageId = null
      if (alertTemplateId != null) {
        ;[alertMessageId] = await knex('AlertMessage').insert(
          Object.assign(
            {
              alertTemplateId,
            },
            sharedMessageProperties
          )
        )
        context.alertMessageCreated(alertMessageId)
      }

      let emailMessageId = null
      if (emailTemplateId != null) {
        ;[emailMessageId] = await knex('EmailMessage').insert(
          Object.assign(
            {
              emailTemplateId,
            },
            sharedMessageProperties
          )
        )
        context.emailMessageCreated(emailMessageId)
      }

      let smsMessageId = null
      if (smsTemplateId != null) {
        ;[smsMessageId] = await knex('SmsMessage').insert(
          Object.assign(
            {
              smsTemplateId,
            },
            sharedMessageProperties
          )
        )
        context.smsMessageCreated(smsMessageId)
      }

      let webhookMessageId = null
      if (webhookTemplateId != null) {
        ;[webhookMessageId] = await knex('WebhookMessage').insert(
          Object.assign(
            {
              webhookTemplateId,
            },
            sharedMessageProperties
          )
        )
        context.webhookMessageCreated(webhookMessageId)
      }

      await knex('NotificationLog').insert({
        notificationId,
        alertMessageId,
        emailMessageId,
        smsMessageId,
        webhookMessageId,
        createdOn: now,
      })
    }
  })
}

module.exports = {
  listNotifications,
  onIssueCreated,
  onIssueEscalated,
  onIssueResolved,
  onNotificationCreated,
}
