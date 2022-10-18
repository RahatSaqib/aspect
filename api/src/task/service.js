const _ = require('lodash')
const { knex } = require('../db')
const setupPaginator = require('../shared/knex-paginator')
const { getAccountDetailsForUsername } = require('../accountDetails/service')
const { getConstraints, addConstraints } = require('../auth/constraints')

setupPaginator(knex)

const RESOLVED_ISSUE_STATUS = 'Resolved'
const INACTIVE_ISSUE_STATUS = 'Inactive'
const OK_ISSUE_STATUS = 'Ok'
async function baseAlertMessagesQuery(request, query, queryBuilder) {
  const loggedUserName = request.auth.credentials.name
  const accountDetails = await getAccountDetailsForUsername(loggedUserName)
  const sortColumn = query.sortCol ? query.sortCol : 'time'
  const dataConstraints = await getConstraints(request.auth.credentials)
  const result = await knex('AlertMessage as am')
    .join('Notification as notif', 'am.id', 'notif.alertMessageId')
    .join('Issue as i', 'notif.issueId', 'i.id')
    .join('Site as site', 'i.siteId', 'site.id')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .leftJoin('Device as d', 'i.deviceId', 'd.id')
    .leftJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .leftJoin('IssueCategory as ic', 'it.issueCategoryId', 'ic.id')
    .where(builder => {
      if (_.isString(query.issueCategory) && query.issueCategory !== 'all')
        builder = builder.where(knex.raw('lower(ic.shortName)'), query.issueCategory.toLowerCase())
      if (_.isString(query.alertType) && query.alertType !== 'all') builder = builder.where('it.name', query.alertType)
      if (_.isInteger(query.deviceId)) builder = builder.where('am.deviceId', query.deviceId)
      if (_.isInteger(query.siteId)) builder = builder.where('am.siteId', query.siteId)

      return builder
        .where('am.personId', accountDetails.id)
        .whereNotIn('is.externalid', [RESOLVED_ISSUE_STATUS, INACTIVE_ISSUE_STATUS, OK_ISSUE_STATUS])
    })
    .where('it.hasTag', 1)
    .modify(addConstraints, dataConstraints, { device: 'd', site: 'site' })
    .modify(queryBuilder)
    .orderBy(sortColumn, query.sortDir)
    .paginate(query.size || 10, query.page || 0, true)
  return result
}

async function listTasksByStatus(request) {
  const { query } = request
  const issueCategoryId = query.categoryId
  const { date, alertTemplateId } = query
  const sqlDate = new Date(date).toISOString().split('T')[0] // eslint-disable-line newline-per-chained-call
  const queryKnex = await baseAlertMessagesQuery(request, query, builder => {
    builder
      .where('ic.Id', issueCategoryId)
      .where('am.alertTemplateId', alertTemplateId)
      .whereRaw('date(am.createdOn) = ?', [sqlDate])
      .select(
        'am.id as id',
        'site.name as site',
        'site.id as siteId',
        'ic.externalId as issueCategoryExternalId',
        'd.name as device',
        'd.id as deviceId',
        'is.name as issueStatus',
        'is.Id as issueStatusId',
        'ic.shortname as issueCategory',
        'ic.Id as issueCategoryId',
        knex.raw('am.createdOn as time'),
        'am.message',
        knex.raw('ifnull(d.name,site.name) as title')
      )
  })
  const result = processTaskResults(queryKnex.data, queryKnex.total || 0)

  return result
}

async function listTasks(request) {
  const { query } = request

  const queryKnex = await baseAlertMessagesQuery(request, query, queryBuilder => {
    queryBuilder
      .select(
        knex.raw('max(am.id) as id'),
        'am.alertTemplateId',
        knex.raw("group_concat(DISTINCT site.name separator ', ') as site"),
        'is.name as issueStatus',
        'is.i18nkey as issueStatusI18nKey',
        'am.alertTemplateId',
        'is.Id as issueStatusId',
        'ic.shortname as issueCategory',
        'ic.i18nkey as issueCategoryI18nKey',
        'ic.Id as issueCategoryId',
        'ic.externalId as issueCategoryExternalId',
        knex.raw('max(am.createdOn) as time'),
        'am.message',
        knex.raw('sum(case when i.id is null then 0 else 1 end) as issueCount'),
        knex.raw("group_concat(DISTINCT ifnull(d.name,site.name) separator ', ') as title")
      )
      .groupBy('is.id', 'am.alertTemplateId', 'ic.name', 'ic.id', 'ic.externalId', knex.raw('date(am.createdOn)'))
  })
  const result = processTaskResults(queryKnex.data, queryKnex.total || 0)
  return result
}

function processTaskResults(dataWithFilteredIssueCategory, total) {
  const countByAlert = _.countBy(dataWithFilteredIssueCategory, 'issueCategory')
  countByAlert.total = total

  const result = {
    ok: true,
    total,
    data: dataWithFilteredIssueCategory,
    countByAlert,
    length: dataWithFilteredIssueCategory.length,
  }

  return result
}

async function getTask(request) {
  const {
    params: { taskId },
  } = request
  const loggedUserName = request.auth.credentials.name
  const accountDetails = await getAccountDetailsForUsername(loggedUserName)

  const task = await getTaskDetailsQuery(taskId, accountDetails.id)
  const persons = await getPersonsBySite(task.siteId)
  if (persons) {
    task.jobPersons = _.map(persons, person => ({
      personName: person.jobPersons,
      personId: person.jobPersonsId,
    }))
  } else task.jobPersons = []

  return task
}

async function getPersonsBySite(siteId) {
  const query = await knex('JobContext as jb')
    .leftJoin('Job as job', 'jb.jobId', 'job.Id')
    .leftJoin('Person as jobperson', 'job.personId', 'jobperson.Id')
    .where('jb.siteId', siteId)
    .select('jobperson.name as jobPersons', 'jobperson.id as jobPersonsId')
  return query
}

async function getTaskDetailsQuery(taskId, userId) {
  const dataConstraints = await getConstraints({ userId })
  return knex('AlertMessage as am')
    .join('Person as p', 'am.personId', 'p.Id')
    .join('Notification as notif', 'am.id', 'notif.alertMessageId')
    .join('Site as site', 'am.siteId', 'site.id')
    .leftJoin('Device as d', 'am.deviceId', 'd.id')
    .leftJoin('Issue as i', 'notif.issueId', 'i.id')
    .leftJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .leftJoin('IssueType as it', 'i.issueTypeId', 'it.id')
    .leftJoin('IssueCategory as ic', 'it.issueCategoryId', 'ic.id')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 'site',
    })
    .where('am.Id', taskId)
    .where('am.personId', userId)
    .first(
      'am.id as id',
      'site.name as site',
      'site.id as siteId',
      'd.name as device',
      'd.id as deviceId',
      'is.name as issueStatus',
      'is.Id as issueStatusId',
      'ic.name as issueCategory',
      'p.name as personName',
      'ic.Id as issueCategoryId',
      'am.createdOn as time',
      'am.message',
      knex.raw('ifnull(d.name,site.name) as title')
    )
    .groupBy(
      'am.id',
      'site',
      'site.id',
      'd.name',
      'd.id',
      'issueStatus',
      'issueStatusId',
      'issueCategory',
      'personName',
      'issueCategoryId',
      'time',
      'am.message',
      'title'
    )
}

module.exports = {
  listTasks,
  listTasksByStatus,
  getTask,
}
