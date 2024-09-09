const { knex, sortPageParams, filterParams, filterDateRangeParams } = require('../db')
const { getHash } = require('./encryption')
const { jsonToArraySorted } = require('./sort')

const ASYNC_REPORT_FIELDS = [
  'r.name',
  'ar.filePath',
  'ar.reportId',
  'ar.expiresOn',
  'ars.externalId as status',
  'r.externalId',
  'urr.createdOn',
]

const sortColumnMapping = {
  createdOn: 'urr.createdOn',
  endedOn: 'ar.endedOn',
  startedOn: 'ar.startedOn',
  externalId: 'r.externalId',
  status: 'ars.externalId',
  name: 'r.name',
}

async function getAllAsyncReportsForUser(query, personId) {
  /**
   * If reportFilters is passed, we need to hash the query
   */
  if (query.reportFilters) {
    /* eslint no-unused-vars: 0 */
    const { reportFilters, ...filteredQuery } = query

    const querySorted = jsonToArraySorted(filteredQuery)

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

const updateAsyncReport = async (asyncReportId, payload) => {
  return knex('AsyncReport').where('id', asyncReportId).update(payload)
}

module.exports = {
  getExistingReportWithHash,
  getAllAsyncReportsForUser,
  updateAsyncReport,
}
