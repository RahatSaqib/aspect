const fs = require('fs')
const jwt = require('jsonwebtoken')
const config = require('../config')
const { readDataFromFile } = require('../shared/io')
const { respondFile } = require('../shared/response')
const { startReportDownloadLog, finishReportDownloadLog } = require('./reportDownloadLog')

/**
 * This method allows to download a scheduled report file.
 * @param {*} request - Hapi request.
 * @param {*} reply - Hapi reply.
 * @returns The received Hapi reply object with the appropiate reponse and the report as content.
 */
module.exports = async function downloadScheduledReport(request, reply) {
  const { query } = request
  const { token } = query
  const handlerStart = Date.now()

  let fileName = null
  let logId = null

  try {
    const tokenPayload = jwt.verify(token, config.secret)
    ;({ report_filename: fileName } = tokenPayload)

    logId = await startReportDownloadLog({
      reportExternalId: tokenPayload.reportExternalId ?? null,
      format: tokenPayload.format ?? (fileName?.endsWith('.csv') ? 'csv' : 'xlsx'),
      query: tokenPayload.filters ?? {},
      source: 'scheduled',
    }).catch(() => null)

    const filePath = `/tmp/${fileName}`
    const { size: fileSizeBytes } = await fs.promises.stat(filePath)
    const dataBuffer = await readDataFromFile(filePath)

    void finishReportDownloadLog(logId, {
      success: 1,
      generationTimeMs: 0,
      totalTimeMs: Date.now() - handlerStart,
      fileSizeBytes,
    })

    return respondFile({
      reply,
      fileName,
      dataBuffer,
      streamResponse: true,
    })
  } catch (error) {
    void finishReportDownloadLog(logId, {
      success: 0,
      generationTimeMs: Date.now() - handlerStart,
      totalTimeMs: Date.now() - handlerStart,
      errorMessage: error.message,
    })

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
