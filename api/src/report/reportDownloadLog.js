const { knex } = require('../db')
const logger = require('../shared/logger')

const MAX_ERROR_MESSAGE_LENGTH = 2048

async function startReportDownloadLog({ userName, reportExternalId, format, query, source, asyncReportId }) {
  try {
    const [logId] = await knex('ReportDownloadLog').insert({
      userName: userName ?? null,
      reportExternalId: reportExternalId ?? null,
      format,
      query: JSON.stringify(query ?? {}),
      source,
      asyncReportId: asyncReportId ?? null,
      success: null,
      createdOn: new Date(),
    })
    return logId
  } catch (err) {
    logger.warning('Failed to start ReportDownloadLog entry', { err, reLabel: 'aspect:report:downloadLog' })
    return null
  }
}

async function finishReportDownloadLog(logId, { success, generationTimeMs, totalTimeMs, fileSizeBytes, errorMessage }) {
  if (!logId) {
    return
  }

  try {
    const truncatedError =
      errorMessage && errorMessage.length > MAX_ERROR_MESSAGE_LENGTH
        ? errorMessage.slice(0, MAX_ERROR_MESSAGE_LENGTH)
        : errorMessage

    await knex('ReportDownloadLog')
      .where({ id: logId })
      .update({
        success,
        generationTimeMs: generationTimeMs ?? null,
        totalTimeMs: totalTimeMs ?? null,
        fileSizeBytes: fileSizeBytes ?? null,
        errorMessage: truncatedError ?? null,
        endedOn: new Date(),
      })
  } catch (err) {
    logger.warning('Failed to finish ReportDownloadLog entry', { err, logId, reLabel: 'aspect:report:downloadLog' })
  }
}

module.exports = {
  startReportDownloadLog,
  finishReportDownloadLog,
}
