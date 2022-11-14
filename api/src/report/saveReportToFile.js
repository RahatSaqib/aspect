const { getUserFromCredentials } = require('../auth/constraints')
const { writeDataToFile } = require('../shared/io')
const { generateReport } = require('./serviceReports')

/**
 * Execute a report and save it to disk.
 * @param {Object} auth - auth like object with personId and credentials
 * @param {Object} query - query params
 * @param {string} externalId - externalId of the report
 */
module.exports = async function saveReportToFile(auth, query, externalId) {
  const user = await getUserFromCredentials(auth.credentials)
  // Reports needs a valid user. While sending notification we have a group of user,
  // so we keep userPlaceHolders empty to avoid show personal user data
  const userPlaceHolders = {}
  // ---------------------------------------------------------
  const { dataBuffer, fileName } = await generateReport(externalId, query, auth, user, userPlaceHolders)

  // TODO: Replace /tmp for an environment variable.
  await writeDataToFile(`/tmp/${fileName}`, dataBuffer)

  return fileName
}
