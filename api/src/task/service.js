const _ = require('lodash')
const { knex } = require('../db')
const { getAccountDetailsForUsername } = require('../accountDetails/service')

const RESOLVED_ISSUE_STATUS = 8
const OK_ISSUE_STATUS = 4

async function getQuery(request, query, queryBuilder) {
  const loggedUserName = request.auth.credentials.name
  const accountDetails = await getAccountDetailsForUsername(loggedUserName)
  const sortColumn = query.sortCol ? query.sortCol : 'time'

  return knex('AlertMessage as am')
    .join('Notification as notif', 'am.id', 'notif.alertMessageId')
    .join('Site as site', 'am.siteId', 'site.id')
    .join('Device as d', 'am.deviceId', 'd.id')
    .leftJoin('Issue as i', 'notif.issueId', 'i.id')
    .leftJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .leftJoin('IssueType as it', 'i.issueTypeId', 'it.id')
    .leftJoin('IssueCategory as ic', 'it.issueCategoryId', 'ic.id')
    .modify(queryBuilder)
    .where(builder => {
      if (_.isString(query.topic) && query.topic !== 'all')
        builder = builder.where('ic.name', query.topic)
      return builder
        .where('am.personId', accountDetails.id)
        .whereNotIn('is.id', [RESOLVED_ISSUE_STATUS, OK_ISSUE_STATUS])
    })
    .select(
      'am.id as id',
      'site.name as site',
      'is.name as issueStatus',
      'is.Id as issueStatusId',
      'ic.name as issueCategory',
      'ic.Id as issueCategoryId',
      knex.raw('date(am.createdOn) as time'),
      'am.message',
      knex.raw('sum(case when i.id is null then 0 else 1 end) as issueCount'),
      knex.raw('ifnull(d.name,site.name) as title')
    )
    .orderBy(sortColumn, query.sortDir)
}

async function listTasksByStatus(request) {
  const { query } = request
  const issueStatus = query.statusId
  const { siteId, date } = query

  console.log(issueStatus, siteId, date)

  const queryKnex = await getQuery(request, query)

  const dataWithFilteredTopic = queryKnex

  return processTaskResults(dataWithFilteredTopic, query)
}
async function listTasks(request) {
  const { query } = request

  const queryKnex = await getQuery(request, query, queryBuilder => {
    queryBuilder.groupBy(
      'site',
      'issueStatus',
      'issueStatusId',
      'title',
      'issueCategory',
      'issueCategoryId',
      'time'
    )
  })
  const dataWithFilteredTopic = queryKnex
  return processTaskResults(dataWithFilteredTopic, query)
}

function processTaskResults(dataWithFilteredTopic, query) {
  const countByAlert = _.countBy(dataWithFilteredTopic, 'issueCategory')
  countByAlert.total = dataWithFilteredTopic.length
  const rawData = _.flowRight(
    _.isString(query.alertType) && query.alertType !== 'all'
      ? x => _.filter(x, ['issueCategory', query.alertType])
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
  listTasksByStatus,
}
