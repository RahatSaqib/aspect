const { subHours } = require('date-fns')
const { values, reduce } = require('lodash')
const { knex } = require('../db')
const { asyncReportStatusToId } = require('./dictionary')

const ASYNC_REPORT_FIELDS = [
  'ar.id',
  'ar.filePath',
  'ar.statusId',
  'ar.reportId',
  'ar.hash',
  'ar.expiresOn',
  's.externalId as status',
  'r.externalId as reportKey',
]
function getSinceThreshold() {
  const since24HoursAgoISO = subHours(new Date(), 24).toISOString().split('.')[0]
  return since24HoursAgoISO
}

async function getAllAsyncReportsForUser(username) {
  const since24HoursAgoISO = getSinceThreshold()

  /**
   * get all reports requested by current user within last 24 hours
   */
  const rawItems = await knex('AsyncReport as ar')
    .join('Report as r', 'ar.reportId', 'r.id')
    .join('AsyncReportStatus as s', 'ar.statusId', 's.id')
    .join('UserReportRequest as urr', 'ar.id', 'urr.asyncReportId')
    .join('User as u', 'u.id', 'urr.userId')
    .where('u.name', username)
    .where('ar.createdOn', '>=', since24HoursAgoISO)
    .orderBy(['ar.createdOn'], 'desc')
    .select(ASYNC_REPORT_FIELDS)
  // convert `auth` and `query` fields from string to json
  let items = reduce(
    rawItems,
    (acc, it) => {
      if (!acc[it.hash]) {
        acc[it.hash] = it
      }
      return acc
    },
    {}
  )

  items = values(items)
  return items
}

const getExistingReportWithHash = async hash => {
  /**
   * from ICO (Z) timezone "2011-10-05T14:48:00.000Z" to needed
   * format for db "2011-10-05 14:48:00"
   */
  // const nowISO = new Date().toISOString().replace('T', ' ').split('.')[0]
  const now = new Date()
  const since24HoursAgoISO = getSinceThreshold()
  const validSinceISO = subHours(now, 4).toISOString().split('.')[0]
  /**
   * get most recent entry with this hash
   */
  return knex('AsyncReport as ar')
    .join('AsyncReportStatus as s', 'ar.statusId', 's.id')
    .where('ar.hash', hash)
    .where('ar.createdOn', '>=', since24HoursAgoISO)
    .where(function () {
      this
        /**
         * expiredOn is NULL and status is not 'ready'
         */
        .where(bld => bld.whereNull('ar.expiresOn').andWhereNot('s.externalId', 'ready'))
        /**
         * or expiredOn is defined and report is valid
         */
        .orWhere(bld => bld.whereNotNull('ar.expiresOn').andWhere('ar.expiresOn', '>=', validSinceISO))
    })
    .orderBy(['ar.createdOn'], 'desc')
    .first('ar.id')
}

const processNewReport = async payload => {
  const { reportId, hash, query } = payload

  const statusId = await asyncReportStatusToId('queued')
  const [asyncReportId] = await knex('AsyncReport').insert({
    reportId,
    hash,
    query: JSON.stringify(query),
    statusId,
  })

  // TODO: Push to Bull MQ

  return asyncReportId
}

const getReportRequest = async (asyncReportId, currentUserId) => {
  return knex('UserReportRequest').where({ userId: currentUserId, asyncReportId }).first()
}

const createReportRequest = async (asyncReportId, currentUserId) => {
  return knex('UserReportRequest').insert({
    userId: currentUserId,
    asyncReportId,
    requestCount: 1,
  })
}

const handleExistingReport = async (asyncReportId, currentUserId) => {
  const existingRequest = await getReportRequest(asyncReportId, currentUserId)

  if (existingRequest) {
    return knex('UserReportRequest').where({ userId: currentUserId, asyncReportId }).increment('requestCount', 1)
  }

  return this.createReportRequest(asyncReportId, currentUserId)
}

module.exports = {
  getAllAsyncReportsForUser,
  getSinceThreshold,
  getExistingReportWithHash,
  processNewReport,
  handleExistingReport,
  createReportRequest,
}
