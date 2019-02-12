const _ = require('lodash')
const { knex } = require('../db')
const { getAccountDetailsForUsername } = require('../accountDetails/service')

const RESOLVED_ISSUE_STATUS = 8
const OK_ISSUE_STATUS = 4

async function listTasks(request) {
  const { query } = request

  const loggedUserName = request.auth.credentials.name

  const accountDetails = await getAccountDetailsForUsername(loggedUserName)
  const sortColumn = query.sortCol ? query.sortCol : 'id'

  const dataWithFilteredTopic = await knex('AlertMessage as am')
    .join('Notification as notif', 'am.id', 'notif.alertMessageId')
    .join('Site as site', 'am.siteId', 'site.id')
    .join('Device as d', 'am.deviceId', 'd.id')
    .leftJoin('Issue as i', 'notif.issueId', 'i.id')
    .leftJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .leftJoin('IssueType as it', 'i.issueTypeId', 'it.id')
    .leftJoin('IssueCategory as ic', 'it.issueCategoryId', 'ic.id')
    .select(
      'am.id as id',
      'site.name as site',
      'is.name as issueStatus',
      'ic.name as issueCategory',
      knex.raw('date(i.createdOn) as time'),
      'am.message',
      knex.raw('sum(case when i.id is null then 0 else 1 end) as issueCount'),
      knex.raw('ifnull(d.name,site.name) as title')
    )
    .groupBy('site', 'issueStatus', 'title', 'issueCategory', 'time')
    .where(builder => {
      if (_.isString(query.topic) && query.topic !== 'all')
        builder = builder.where('ic.name', query.topic)
      return builder
        .where('am.personId', accountDetails.id)
        .whereNotIn('is.id', [RESOLVED_ISSUE_STATUS, OK_ISSUE_STATUS])
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
