const _ = require('lodash')
const { knex } = require('../db')
const subDays = require('date-fns/sub_days')
const subMinutes = require('date-fns/sub_minutes')

async function listTasks(request) {
  const { query } = request

  const now = new Date()

  const sortColumn = query.sortCol ? query.sortCol : 'id'

  const dataWithFilteredTopic /* _.flowRight(
    
    
    x => _.sortBy(x, query.sortCol || _.identity)
  )( */ = await knex(
    'AlertMessage as am'
  )
    .join('Notification as notif', 'am.id', 'notif.alertMessageId')
    .leftJoin('Issue as i', 'notif.issueId', 'i.id')
    .leftJoin('IssueType as it', 'i.issueTypeId', 'it.id')
    .leftJoin('IssueCategory as ic', 'it.issueCategoryId', 'ic.id')
    .leftJoin('Site as site', 'i.siteId', 'site.id')
    .leftJoin('Device as d', 'i.deviceId', 'd.id')
    .select(
      'am.id as id',
      'site.name as site',
      'it.name as alertType',
      'ic.name as topic',
      knex.raw('date(i.createdOn) as time'),
      'am.message',
      knex.raw(
        'sum(case when i.id is null then 0 else 1 end) as notificationCount'
      ),
      knex.raw('ifnull(d.name,site.name) as title')
    )
    .groupBy('site', 'alertType', 'title', 'topic', 'time')
    .where(builder => {
      if (_.isString(query.topic) && query.topic !== 'all')
        return builder.where('ic.name', query.topic)
      return builder
    })
    .orderBy(sortColumn, query.sortDir)
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
