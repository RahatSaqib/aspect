const _ = require('lodash')
const subMinutes = require('date-fns/sub_minutes')
const { getJobConstraints, addConstraints } = require('../auth/constraints')
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

async function onIssueTriggered({ issueId }, context) {
  await onIssueEscalated({ issueId }, context)
}

async function onIssueEscalated({ issueId }, { messageContext: context }) {
  context.bindActionCreators({
    notificationCreated,
    alertMessageCreated,
    emailMessageCreated,
    smsMessageCreated,
    webhookMessageCreated,
  })
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
    for (const policy of policies) {
      /* eslint-disable no-await-in-loop */
      if (policy.jobFunctionId !== jobFunctionId) {
        ;({ jobFunctionId, level: jobFunctionLevel } = policy)
      } else if (policy.level !== jobFunctionLevel) {
        // This is a lower level for this particular job function
        // continue until we get to end of list or new job function
        /* eslint-disable no-continue */
        continue
      }

      const people = await knex('Job as j')
        .join('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
        .where({ 'jf.id': policy.jobFunctionId })
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
            const notification = {
              issueId,
              notificationTypeId: policy.id,
              personId: person.id,
            }
            const existingNotification = await knex('Notification')
              .where(notification)
              .first()
            if (existingNotification == null) {
              notification.createdOn = now
              const { id: messageStatusId } = await knex('MessageStatus')
                .where({ externalId: 'Initial' })
                .first('id')

              const sharedMessageProperties = {
                messageStatusId,
                personId: person.id,
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

              const [notificationId] = await knex('Notification').insert(
                notification
              )
              context.notificationCreated(notificationId)
            }
          }
        })
      )
    }
  })
}

module.exports = {
  listNotifications,
  onIssueTriggered,
  onIssueEscalated,
}
