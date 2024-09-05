const { subHours } = require('date-fns')
const { knex, sortPageParams, filterParams, filterDateRangeParams } = require('../db')
const { asyncReportStatusToId } = require('./dictionary')
const { getHash } = require('./encryption')
const { jsonToArraySorted } = require('./sort')

const ASYNC_REPORT_FIELDS = [
  'ar.id as requestId',
  'r.name',
  'ar.filePath',
  'ar.reportId',
  'ar.expiresOn',
  'ars.externalId as status',
  'r.externalId',
  'urr.createdOn',
  knex.raw("ar.query->>'$.format' as reportFormat"),
  knex.raw("ar.query->>'$.minDate' as reportFromDate"),
  knex.raw("ar.query->>'$.maxDate' as reportToDate"),
  knex.raw("ar.query->>'$.siteName' as reportSiteName"),
  knex.raw("(SELECT name FROM Consumable WHERE id = ar.query->>'$.consumableId') as reportConsumableName"),
  knex.raw("(SELECT name FROM State WHERE id = ar.query->>'$.stateId') as reportStateName"),
  knex.raw("(SELECT name FROM Country WHERE id = ar.query->>'$.countryId') as reportCountryName"),
]

const sortColumnMapping = {
  createdOn: 'urr.createdOn',
  endedOn: 'ar.endedOn',
  startedOn: 'ar.startedOn',
  externalId: 'r.externalId',
  status: 'ars.externalId',
  name: 'r.name',
}

function getSinceThreshold() {
  const since24HoursAgoISO = subHours(new Date(), 24).toISOString().split('.')[0]
  return since24HoursAgoISO
}

async function getAllAsyncReportsForUser(query, personId) {
  /**
   * If reportsFilter is passed, we need to hash the query
   */
  if (query.reportsFilter) {
    const { reportsFilter, ...filteredQuery } = query

    const querySorted = jsonToArraySorted(reportsFilter)

    const queryHash = getHash(JSON.stringify(querySorted))
    query = filteredQuery
    query.queryHash = queryHash
  }

  const now = new Date()

  const reports = await knex('AsyncReport as ar')
    .join('Report as r', 'ar.reportId', 'r.id')
    .join('AsyncReportStatus as ars', 'ar.statusId', 'ars.id')
    .join('UserReportRequest as urr', 'ar.id', 'urr.asyncReportId')
    .join('User as u', 'u.id', 'urr.userId')
    .leftJoin('State as state', function () {
      this.on('state.id', knex.raw("COALESCE(ar.query->>'$.stateId', 'null')"))
    })
    .leftJoin('Consumable as consumable', function () {
      this.on('consumable.id', knex.raw("COALESCE(ar.query->>'$.consumableId', 'null')"))
    })
    .leftJoin('Country as country', function () {
      this.on('country.id', knex.raw("COALESCE(ar.query->>'$.countryId', 'null')"))
    })
    .join('Person as p', 'u.id', 'p.userId')
    .where('p.id', personId)
    .where(function () {
      this.where('ar.expiresOn', '>', now).orWhereNull('ar.expiresOn')
    })
    .modify(filterDateRangeParams, query, 'urr.createdOn')
    .modify(filterParams, query, {
      status: 'ars.externalId',
      queryHash: 'ar.queryHash',
      reportId: 'r.id',
    })
    .modify(sortPageParams, query, 'urr.createdOn', sortColumnMapping)
    .select(ASYNC_REPORT_FIELDS)
    .orderBy(['ar.createdOn'], 'asc')

  return reports
}

const getExistingReportWithHash = async hash => {
  const now = new Date()
  /**
   * get report with this hash
   */
  return knex('AsyncReport as ar')
    .join('AsyncReportStatus as s', 'ar.statusId', 's.id')
    .where('ar.hash', hash)
    .where(function () {
      this.where('ar.expiresOn', '>', now).orWhereNull('ar.expiresOn')
    })
    .orderBy(['ar.createdOn'], 'desc')
    .first()
    .select([
      'ar.id',
      'ar.reportId',
      'ar.createdOn',
      'ar.expiresOn',
      'ar.startedOn',
      'ar.endedOn',
      'ar.filePath',
      's.externalId as status',
    ])
}

const processNewReport = async payload => {
  const { reportId, hash, query, queryHash } = payload

  const statusId = await asyncReportStatusToId('queued')
  const [asyncReportId] = await knex('AsyncReport').insert({
    reportId,
    hash,
    queryHash,
    query: JSON.stringify(query),
    statusId,
  })

  // TODO: Push to BULL MQ
  // queue().add('asyncReports', { asyncReportId, auth, query, externalId, useUserPlaceHolders = false })

  return asyncReportId
}

const createReportRequest = async (asyncReportId, currentUserId) => {
  return knex('UserReportRequest').insert({
    userId: currentUserId,
    asyncReportId,
    requestCount: 1,
  })
}

const incrementRequestCount = async (asyncReportId, currentUserId) => {
  return knex('UserReportRequest').where({ userId: currentUserId, asyncReportId }).increment('requestCount', 1)
}

module.exports = {
  getSinceThreshold,
  getExistingReportWithHash,
  processNewReport,
  createReportRequest,
  getAllAsyncReportsForUser,
  incrementRequestCount,
}
