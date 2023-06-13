const jwt = require('jsonwebtoken')
const config = require('../config')
const { readDataFromFile } = require('../shared/io')
const { respondFile } = require('../shared/response')

/**
 * This method allows to download a scheduled report file.
 * @param {*} request - Hapi request.
 * @param {*} reply - Hapi reply.
 * @returns The received Hapi reply object with the appropiate reponse and the report as content.
 */
module.exports = async function downloadScheduledReport(request, reply) {
  const { query } = request
  const { token } = query

  const { report_filename: fileName } = jwt.verify(token, config.secret)

  const dataBuffer = await readDataFromFile(`/tmp/${fileName}`)

  return respondFile({
    reply,
    fileName,
    dataBuffer,
    streamResponse: true,
  })
}
