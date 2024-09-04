const { getConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const { reportToId } = require('../shared/dictionary')
const {
  processNewReport,
  getExistingReportWithHash,
  createReportRequest,
  incrementRequestCount,
} = require('../shared/report')
const { jsonToArraySorted } = require('../shared/sort')
const { getHash } = require('../shared/encryption')

module.exports = async function processAsyncReport(request) {
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
    }

    const asyncReportId = await processNewReport(payload)
    await createReportRequest(asyncReportId, currentUserId)
  }

  return {
    message: 'Report requested',
  }
}
