const { getConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const { reportToId } = require('../shared/dictionary')
const {
  processNewReport,
  getExistingReportWithHash,
  getAllAsyncReportsForUser,
  handleExistingReport,
  createReportRequest,
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

  const now = new Date()
  const querySorted = jsonToArraySorted(query)
  const queryHash = getHash(JSON.stringify(querySorted))

  delete dataConstraints.person // <-- remove personality and leave only country/partner/jobFunction details

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
    await handleExistingReport(existingReport.id, currentUserId)
  } else {
    const payload = {
      reportId,
      auth,
      query,
      hash,
      queryHash,
      currentUserId,
      now,
    }

    const asyncReportId = await processNewReport(payload)
    await createReportRequest(asyncReportId, currentUserId)
  }

  /**
   * get all reports requested by current user within last 24 hours
   */
  const reports = await getAllAsyncReportsForUser(auth.credentials.name)

  return {
    reports,
  }
}
