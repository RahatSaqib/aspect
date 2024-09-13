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
  'ar.startedOn',
  'ar.endedOn',
  'ar.query',
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

  const reportsWithParsedQuery = await reports.map(report => ({ ...report, query: JSON.parse(report.query) }))

  // for efficient usage of indices we are fetching the data in sub queries
  const { states, consumables, countries } = await fetchAllSubqueriesData(reportsWithParsedQuery)

  const statesById = states.reduce((acc, state) => ({ ...acc, [state.id]: state }), {})
  const consumablesById = consumables.reduce((acc, consumable) => ({ ...acc, [consumable.id]: consumable }), {})
  const countriesById = countries.reduce((acc, country) => ({ ...acc, [country.id]: country }), {})

  return reportsWithParsedQuery.map(({ query, ...report }) => {
    // removing query from the report
    return {
      ...report,
      reportFormat: query?.format ?? null,
      reportFromDate: query?.minDate ?? null,
      reportToDate: query?.maxDate ?? null,
      reportSiteName: query?.siteName ?? null,
      reportConsumableName: consumablesById[query?.consumableId]?.name ?? null,
      reportStateName: statesById[query?.stateId]?.name ?? null,
      reportCountryName: countriesById[query?.countryId]?.name ?? null,
    }
  })
}

const fetchAllSubqueriesData = async asyncReports => {
  const subQueries = asyncReports.map(({ reportId, query }) => {
    const { stateId, consumableId, countryId } = query ?? {}
    return {
      stateId,
      consumableId,
      countryId,
      reportId,
    }
  })

  const stateIds = new Set()
  const consumableIds = new Set()
  const countryIds = new Set()

  subQueries.forEach(({ stateId, consumableId, countryId }) => {
    stateIds.add(stateId)
    consumableIds.add(consumableId)
    countryIds.add(countryId)
  })

  const [states, consumables, countries] = await Promise.all([
    knex('State').whereIn(
      'id',
      [...stateIds].filter(id => id)
    ),
    knex('Consumable').whereIn(
      'id',
      [...consumableIds].filter(id => id)
    ),
    knex('Country').whereIn(
      'id',
      [...countryIds].filter(id => id)
    ),
  ])

  return { states, consumables, countries }
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
