const { getUser } = require('../auth/service')
const { respondFile } = require('../shared/excel')
const { generateReport } = require('./serviceReports')

/**
 * This method execute a report and return the result over a hapi reply object.
 * @param {*} request - Hapi request.
 * @param {*} reply - Hapi reply.
 * @returns The received Hapi reply object with the appropiate reponse and the report as content.
 */
module.exports = async function downloadReport(request, reply) {
  const { auth, query, params } = request
  const { externalId } = params
  const user = await getUser(auth.credentials.name)
  const userPlaceHolders = {
    email: user.email,
    cell: user.cell,
  }

  const { dataBuffer, streamResponse, fileName, extension } = await generateReport(
    externalId,
    query,
    auth,
    user,
    userPlaceHolders
  )
  return respondFile({
    dataBuffer,
    extension,
    fileName,
    reply,
    streamResponse,
  })
}
