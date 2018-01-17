const _ = require('lodash')
const subDays = require('date-fns/sub_days')
const subMinutes = require('date-fns/sub_minutes')

function* listTasks(request) {
  const { query } = request

  const now = new Date()

  const dataWithFilteredTopic = _.flowRight(
    _.isString(query.topic) && query.topic !== 'all'
      ? x => _.filter(x, ['topic', query.topic])
      : _.identity,
    query.sortDir === 'desc' ? _.reverse : _.identity,
    x => _.sortBy(x, query.sortCol || _.identity),
    x =>
      x.map((it, i) => {
        it.id = i + 1
        return it
      })
  )([
    {
      alertType: 'mine',
      topic: 'health',
      title: 'TB',
      message: '15% increase in resistant results',
      site: 'Kampala Lab',
      time: subMinutes(now, 5),
      notificationCount: 0,
    },
    {
      alertType: 'mine',
      topic: 'consumable',
      title: 'MediCo TB',
      message: 'LOW STOCK (3 days remaining)',
      site: 'Kampala Lab',
      time: subMinutes(subDays(now, 1), 5),
      notificationCount: 3,
    },
    {
      alertType: 'snoozed',
      topic: 'device',
      title: 'HealthCo HIV Device',
      message: 'NEEDS CALIBRATING by April 10',
      site: 'Mbarara Lab',
      time: subMinutes(subDays(now, 1), 10),
      notificationCount: 2,
    },
    {
      alertType: 'normal',
      topic: 'consumable',
      title: 'HealthCo HIV',
      message: 'EXPIRING STOCK (100 units)',
      site: 'Fort Portal Lab',
      time: subMinutes(subDays(now, 1), 15),
      notificationCount: 3,
    },
    {
      alertType: 'normal',
      topic: 'consumable',
      title: 'HealthCo HIV',
      message: 'MOVE CONSUMABLES',
      site: 'Kampala Lab',
      time: subMinutes(subDays(now, 2), 5),
      notificationCount: 0,
    },
    {
      alertType: 'mine',
      topic: 'site',
      title: 'Fort Portal Lab',
      message: 'TEST QUALITY ISSUES',
      site: 'Fort Portal Lab',
      time: subMinutes(subDays(now, 2), 10),
      notificationCount: 0,
    },
    {
      alertType: 'mine',
      topic: 'device',
      title: 'Aspect Router',
      message: 'LOW BALANCE',
      site: 'Fort Portal Lab',
      time: subMinutes(subDays(now, 3), 5),
      notificationCount: 0,
    },
    {
      alertType: 'mine',
      topic: 'site',
      title: 'Jinja Lab',
      message: 'OFFLINE',
      site: 'Jinja Lab',
      time: subDays(now, 5),
      notificationCount: 0,
    },
    {
      alertType: 'mine',
      topic: 'health',
      title: 'TB',
      message: 'Positive results',
      alertCount: 22,
      site: 'Kampala Lab',
      time: subMinutes(subDays(now, 1), 30),
      notificationCount: 0,
    },
    {
      alertType: 'mine',
      topic: 'device',
      title: 'HealthCo HIV Device',
      message: 'FIRMWARE UPDATE REQUIRED',
      site: 'Fort Portal Lab',
      time: subDays(now, 7),
      notificationCount: 0,
    },
    // ------ Extra Provided by @stefanbaumg ------
    {
      alertType: 'mine',
      topic: 'consumable',
      title: 'Cuyahoga',
      message: 'STOCK EXPIRING (323 cartridges likely to expire October 28)',
      site: 'Cuyahoga Lab',
      time: subMinutes(subDays(now, 2), 20),
      notificationCount: 0,
    },
    {
      alertType: 'mine',
      topic: 'device',
      title: 'GeneXpert',
      message: '#2 HIGH ERROR RATE (15% in last 30 days)',
      site: 'Wayne County Lab',
      time: subMinutes(subDays(now, 3), 10),
      notificationCount: 0,
    },
    {
      alertType: 'mine',
      topic: 'device',
      title: 'Daktari',
      message: 'OFFLINE (device offline for 8 days)',
      site: 'Boston Lab',
      time: subMinutes(now, 10),
      notificationCount: 0,
    },
  ])

  const countByAlert = _.countBy(dataWithFilteredTopic, 'alertType')
  countByAlert.total = dataWithFilteredTopic.length
  const rawData = _.flowRight(
    _.isString(query.alertType) && query.alertType !== 'all'
      ? x => _.filter(x, ['alertType', query.alertType])
      : _.identity
  )(dataWithFilteredTopic)

  const total = rawData.length
  const size = parseInt(query.size, 10)
  const page = parseInt(query.page, 10)
  const data = _.flowRight(x =>
    x.slice(size * page, Math.min(total, size * page + size))
  )(rawData)

  const result = {
    ok: true,
    total,
    data,
    countByAlert,
    length: data.length,
  }

  return result
}

module.exports = {
  listTasks,
}
