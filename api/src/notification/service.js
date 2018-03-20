const _ = require('lodash')
const subMinutes = require('date-fns/sub_minutes')
const { notificationCreated } = require('./actions')

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
      // FIXME Find all people that should be receiving notification based on policy
      const people = []

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

module.exports = {
  listNotifications,
  onIssueCreated,
  onIssueEscalated,
  onIssueResolved,
}
