const { getConstraints, getUserFromCredentials } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const { reportToId, asyncReportStatusToId } = require('../shared/dictionary')
const { getExistingReportWithHash } = require('../shared/report')
const { jsonToArraySorted } = require('../shared/sort')
const { getHash } = require('../shared/encryption')
const { getContentDispositionFilename } = require('../shared/io')
const { getReportDetails } = require('./service')
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
  const { reportId, hash, query, queryHash, auth, useUserPlaceHolders, externalId } = payload

  const statusId = await asyncReportStatusToId('queued')
  const [asyncReportId] = await knex('AsyncReport').insert({
    reportId,
    hash,
    queryHash,
    query: JSON.stringify(query),
    statusId,
  })

  const user = await getUserFromCredentials(auth.credentials)

  const { fileNamePrefix, exportExcel } = await getReportDetails(externalId, { personId: user.personId })

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

  const fullPath = `/tmp/${fileName}`

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
  const { auth: authRaw, query, params } = request

  // const socketId = request.headers['socket-id']
  const auth = { credentials: authRaw.credentials }

  const { id: currentUserId } = await getUser(auth.credentials.name)
  const { externalId } = params
  const dataConstraints = await getConstraints(auth.credentials)
  const reportId = await reportToId(externalId)

  const querySorted = jsonToArraySorted(query)
  const queryHash = getHash(JSON.stringify(querySorted))

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
    }

    const asyncReportId = await saveReportAndPushToQueue(payload)

    await createReportRequest(asyncReportId, currentUserId)
  }

  return {
    message: 'Report requested',
  }
}

module.exports = { processAsyncReportRequest }
