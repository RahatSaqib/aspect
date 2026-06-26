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

  let fileName = null

  try {
    ;({ report_filename: fileName } = jwt.verify(token, config.secret))

    const dataBuffer = await readDataFromFile(`/tmp/${fileName}`)

    return respondFile({
      reply,
      fileName,
      dataBuffer,
      streamResponse: true,
    })
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return reply.response({ error: 'Invalid token' }).code(401)
    }
    if (error.code === 'ENOENT') {
      return reply.response({ error: 'File not found' }).code(404)
    }
    if (error.code === 'EISDIR') {
      return reply.response({ error: 'File is a directory' }).code(400)
    }
    return reply.response({ error: 'Internal server error' }).code(500)
  }
}
