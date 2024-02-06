const Stream = require('stream')
const fs = require('fs')
const Path = require('path')
const { respondFile } = require('../shared/response')
const { saveReportToFile } = require('./saveReportToFile')

/**
 * This method execute a report and return the result over a hapi reply object.
 * @param {*} request - Hapi request.
 * @param {*} reply - Hapi reply.
 * @returns The received Hapi reply object with the appropiate reponse and the report as content.
 */
module.exports = async function downloadReport(request, reply) {
  const { auth, query, params } = request
  const { externalId } = params

  const dataBuffer = new Stream.PassThrough()
  const { fileName, extension, promise } = await saveReportToFile(auth, query, externalId, true)
  promise.then(fullPath => {
    const path = Path.join(fullPath)
    const stream = fs.createReadStream(path)
    stream.pipe(dataBuffer)
  })

  return respondFile({
    dataBuffer,
    extension,
    fileName,
    reply,
    streamResponse: true,
  })
}
