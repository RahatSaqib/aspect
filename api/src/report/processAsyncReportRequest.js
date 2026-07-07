const { getConstraints, getUserFromCredentials } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const { reportToId, asyncReportStatusToId } = require('../shared/dictionary')
const { getExistingReportWithHash } = require('../shared/report')
const { jsonToArraySorted } = require('../shared/sort')
const { getHash } = require('../shared/encryption')
const { getContentDispositionFilename } = require('../shared/io')
const { getReportDetails } = require('./service')
const { buildParamsValidator, resolveParams } = require('./params')
const { queue } = require('../messageQueue')
const { knex } = require('../db')

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

const saveReportAndPushToQueue = async payload => {
  const { reportId, hash, query, queryHash, auth, useUserPlaceHolders, externalId, reportDetails } = payload

  const statusId = await asyncReportStatusToId('queued')

  const user = await getUserFromCredentials(auth.credentials)

  const { fileNamePrefix, exportExcel } = reportDetails

  // default to `xlsx`, notice that query validation allows only 'xlsx', 'csv', or empty/no param
  const extension = query.format === 'csv' || !exportExcel ? 'csv' : 'xlsx'
  const fileName = getContentDispositionFilename(fileNamePrefix, extension)

  // Reports needs a valid user. While sending notification we have a group of user,
  // so we keep userPlaceHolders empty to avoid show personal user data
  const userPlaceHolders = useUserPlaceHolders
    ? {
        email: user.email,
        cell: user.cell,
      }
    : {}

  const [asyncReportId] = await knex('AsyncReport').insert({
    reportId,
    hash,
    queryHash,
    query: JSON.stringify(query),
    statusId,
  })

  const fullPath = `/tmp/async-reports/${fileName}`

  // TODO: Push to BULL MQ
  await queue().add('asyncReports', {
    asyncReportId,
    auth,
    query,
    externalId,
    userPlaceHolders,
    user,
    fullPath,
    extension,
  })

  return asyncReportId
}

async function processAsyncReportRequest(request) {
  const { auth: authRaw, payload, params } = request

  // const socketId = request.headers['socket-id']
  const auth = { credentials: authRaw.credentials }

  const { id: currentUserId } = await getUser(auth.credentials.name)
  const { reportsFilter, ...restPayload } = payload
  const { externalId } = params
  const dataConstraints = await getConstraints(auth.credentials)
  const reportId = await reportToId(externalId)
  const reportDetails = await getReportDetails(externalId, { personId: dataConstraints.person.id })

  buildParamsValidator(reportDetails.parameters)(reportsFilter, { reportExternalId: externalId })
  // hashes must be computed on RESOLVED params so defaulted and explicit requests share the cache
  const resolvedFilter = resolveParams(reportDetails.parameters, reportsFilter, {
    timeZone: restPayload.timeZone ?? (reportsFilter || {}).timeZone,
    reportExternalId: externalId,
  })

  const querySorted = jsonToArraySorted(resolvedFilter)
  const queryHash = getHash(JSON.stringify(querySorted))
  const query = { ...resolvedFilter, ...restPayload }
  /**
   * generate hash from combination of report, query and data constraints
   */
  const sortedCombination = jsonToArraySorted({
    reportId,
    dataConstraints,
    query,
  })
  const hash = getHash(JSON.stringify(sortedCombination))

  const existingReport = await getExistingReportWithHash(hash)

  if (existingReport) {
    await incrementRequestCount(existingReport.id, currentUserId)
  } else {
    const payload = {
      reportId,
      query,
      hash,
      queryHash,
      currentUserId,
      auth,
      useUserPlaceHolders: true,
      externalId,
      reportDetails,
    }

    const asyncReportId = await saveReportAndPushToQueue(payload)

    await createReportRequest(asyncReportId, currentUserId)
  }

  return {
    message: 'Report requested',
  }
}

module.exports = { processAsyncReportRequest }
