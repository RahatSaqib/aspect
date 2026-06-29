const Stream = require('stream')
const fs = require('fs')
const Path = require('path')
const Boom = require('@hapi/boom')
const { getUserFromCredentials } = require('../auth/constraints')
const { respondFile } = require('../shared/response')
const { saveReportToFile } = require('./saveReportToFile')
const { startReportDownloadLog, finishReportDownloadLogInBackground } = require('./reportDownloadLog')
// const { queue } = require('../messageQueue')

/**
 * This method execute a report and return the result over a hapi reply object.
 * @param {*} request - Hapi request.
 * @param {*} reply - Hapi reply.
 * @returns The received Hapi reply object with the appropiate reponse and the report as content.
 */
module.exports = async function downloadReport(request, reply) {
  const { auth, query, params } = request
  const { externalId } = params

  const user = await getUserFromCredentials(auth.credentials).catch(() => null)

  const logId = await startReportDownloadLog({
    userId: user?.id ?? null,
    reportExternalId: externalId,
    format: query.format || 'xlsx',
    query,
    source: 'sync',
  }).catch(() => null)

  try {
    const dataBuffer = new Stream.PassThrough()
    const { fileName, extension, promise } = await saveReportToFile(auth, query, externalId, true)

    const { fullPath, dataQueryTimeSeconds, fileGenerationTimeSeconds } = await promise
    const { size: fileSizeBytes } = await fs.promises.stat(fullPath)

    finishReportDownloadLogInBackground(logId, {
      success: 1,
      dataQueryTimeSeconds,
      fileGenerationTimeSeconds,
      fileSizeBytes,
    })

    const path = Path.join(fullPath)
    const stream = fs.createReadStream(path)
    stream.pipe(dataBuffer)

    return respondFile({
      dataBuffer,
      extension,
      fileName,
      reply,
      streamResponse: true,
    })
  } catch (error) {
    const errorMessage = error?.message || String(error)
    finishReportDownloadLogInBackground(logId, {
      success: 0,
      errorMessage,
    })
    throw Boom.badRequest(error)
  }
}
