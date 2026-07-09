const Stream = require('stream')
const fs = require('fs')
const Boom = require('@hapi/boom')
const { knex } = require('../db')
const { getUser } = require('../auth/service')
const { respondFile } = require('../shared/response')
const { getContentDispositionFilename } = require('../shared/io')

/**
 * Stream a previously generated async report file for the authenticated user.
 */
module.exports = async function downloadAsyncReport(request, reply) {
  const { params, auth } = request
  const { requestId } = params
  const { id: userId } = await getUser(auth.credentials.name)

  const report = await knex('AsyncReport as ar')
    .join('UserReportRequest as urr', 'ar.id', 'urr.asyncReportId')
    .join('AsyncReportStatus as ars', 'ar.statusId', 'ars.id')
    .join('Report as r', 'ar.reportId', 'r.id')
    .where('ar.id', requestId)
    .where('urr.userId', userId)
    .where('ars.externalId', 'ready')
    .where(function () {
      const now = new Date()
      this.where('ar.expiresOn', '>', now).orWhereNull('ar.expiresOn')
    })
    .first('ar.filePath', 'ar.query', 'r.fileNamePrefix', 'r.exportExcel')

  if (!report || !report.filePath) {
    throw Boom.notFound('Report not found or not ready')
  }

  if (!fs.existsSync(report.filePath)) {
    throw Boom.notFound('Report file not found')
  }

  const query = JSON.parse(report.query)
  const extension = query.format === 'csv' || !report.exportExcel ? 'csv' : 'xlsx'
  const fileName = getContentDispositionFilename(report.fileNamePrefix, extension)

  await knex('UserReportRequest').where({ userId, asyncReportId: requestId }).increment('requestCount', 1)

  const dataBuffer = new Stream.PassThrough()
  fs.createReadStream(report.filePath).pipe(dataBuffer)

  return respondFile({
    dataBuffer,
    extension,
    fileName,
    reply,
    streamResponse: true,
  })
}
