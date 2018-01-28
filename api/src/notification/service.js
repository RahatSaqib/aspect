const _ = require('lodash')
const subMinutes = require('date-fns/sub_minutes')

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

module.exports = {
  listNotifications,
}
