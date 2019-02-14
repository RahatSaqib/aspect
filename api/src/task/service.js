const _ = require('lodash')
const { knex } = require('../db')
const setupPaginator = require('../shared/knex-paginator')

const { getAccountDetailsForUsername } = require('../accountDetails/service')

setupPaginator(knex)

const RESOLVED_ISSUE_STATUS = 8
const OK_ISSUE_STATUS = 4

async function getQuery(request, query, queryBuilder) {
  const loggedUserName = request.auth.credentials.name
  const accountDetails = await getAccountDetailsForUsername(loggedUserName)
  const sortColumn = query.sortCol ? query.sortCol : 'time'
  const result = await knex('AlertMessage as am')
    .join('Notification as notif', 'am.id', 'notif.alertMessageId')
    .join('Site as site', 'am.siteId', 'site.id')
    .join('Device as d', 'am.deviceId', 'd.id')
    .leftJoin('Issue as i', 'notif.issueId', 'i.id')
    .leftJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .leftJoin('IssueType as it', 'i.issueTypeId', 'it.id')
    .leftJoin('IssueCategory as ic', 'it.issueCategoryId', 'ic.id')
    .where(builder => {
      if (_.isString(query.topic) && query.topic !== 'all')
        builder = builder.where('ic.name', query.topic)
      if (_.isString(query.alertType) && query.alertType !== 'all')
        builder = builder.where('it.name', query.alertType)

      return builder
        .where('am.personId', accountDetails.id)
        .whereNotIn('is.id', [RESOLVED_ISSUE_STATUS, OK_ISSUE_STATUS])
    })
    .modify(queryBuilder)
    .orderBy(sortColumn, query.sortDir)
    .paginate(query.size || 10, query.page || 1, true)
  return result
}

async function listTasksByStatus(request) {
  const { query } = request
  const issueCategoryId = query.categoryId
  const { date } = query
  const sqlDate = new Date(date).toISOString().split('T')[0]
  console.log(sqlDate)
  const queryKnex = await getQuery(request, query, builder => {
    builder
      .where('ic.Id', issueCategoryId)
      .whereRaw('date(am.createdOn) = ?', [sqlDate])
      .select(
        'am.id as id',
        'site.name as site',
        'is.name as issueStatus',
        'is.Id as issueStatusId',
        'ic.name as issueCategory',
        'ic.Id as issueCategoryId',
        knex.raw('date(am.createdOn) as time'),
        'am.message',
        knex.raw('ifnull(d.name,site.name) as title')
      )
  })
  console.log(queryKnex)

  const result = processTaskResults(queryKnex.data, queryKnex.total || 0)
  console.log(result)
  return result
}
async function listTasks(request) {
  const { query } = request

  const queryKnex = await getQuery(request, query, queryBuilder => {
    queryBuilder
      .select(
        'am.id as id',
        knex.raw("group_concat(DISTINCT site.name separator ', ') as site"),
        'is.name as issueStatus',
        // 'am.alertTemplateId',
        'is.Id as issueStatusId',
        'ic.name as issueCategory',
        'ic.Id as issueCategoryId',
        knex.raw('date(am.createdOn) as time'),
        'am.message',
        knex.raw('sum(case when i.id is null then 0 else 1 end) as issueCount'),
        knex.raw(
          "group_concat(DISTINCT ifnull(d.name,site.name) separator ', ') as title"
        )
      )
      .groupBy(
        'is.id',
        //   'am.alertTemplateId',
        'ic.name',
        'ic.id',
        knex.raw('date(am.createdOn)')
      )
  })
  console.log(queryKnex)

  const result = processTaskResults(queryKnex.data, queryKnex.total)
  console.log(result)
  return result
}

function processTaskResults(dataWithFilteredTopic, total) {
  const countByAlert = _.countBy(dataWithFilteredTopic, 'issueCategory')
  countByAlert.total = total

  const result = {
    ok: true,
    total,
    data: dataWithFilteredTopic,
    countByAlert,
    length: dataWithFilteredTopic.length,
  }

  return result
}

module.exports = {
  listTasks,
  listTasksByStatus,
}
