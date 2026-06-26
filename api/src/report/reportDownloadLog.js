const { knex } = require('../db')
const { daysBetweenDates } = require('../shared/date')
const logger = require('../shared/logger')

const MAX_ERROR_MESSAGE_LENGTH = 2048

function getTimeSpanDaysFromQuery(query = {}) {
  try {
    const { minDate, maxDate } = query
    if (!minDate || !maxDate) {
      return null
    }

    const startDate = new Date(minDate)
    const endDate = new Date(maxDate)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return null
    }

    return daysBetweenDates(startDate, endDate)
  } catch (err) {
    logger.warning('Failed to compute timeSpanDays for ReportDownloadLog', {
      err,
      reLabel: 'aspect:report:downloadLog',
    })
    return null
  }
}

function stringifyQuery(query) {
  try {
    return JSON.stringify(query ?? {})
  } catch (err) {
    logger.warning('Failed to serialize query for ReportDownloadLog', { err, reLabel: 'aspect:report:downloadLog' })
    return '{}'
  }
}

async function startReportDownloadLog({ userId, userName, reportExternalId, format, query, source }) {
  try {
    const [logId] = await knex('ReportDownloadLog').insert({
      userId: userId ?? null,
      userName: userName ?? null,
      reportExternalId: reportExternalId ?? null,
      format,
      query: stringifyQuery(query),
      timeSpanDays: getTimeSpanDaysFromQuery(query),
      source,
      success: null,
      startedOn: new Date(),
    })
    return logId
  } catch (err) {
    logger.warning('Failed to start ReportDownloadLog entry', { err, reLabel: 'aspect:report:downloadLog' })
    return null
  }
}

async function finishReportDownloadLog(
  logId,
  { success, dataQueryTimeSeconds, fileGenerationTimeSeconds, fileSizeBytes, errorMessage }
) {
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
        dataQueryTimeSeconds: dataQueryTimeSeconds ?? null,
        fileGenerationTimeSeconds: fileGenerationTimeSeconds ?? null,
        fileSizeBytes: fileSizeBytes ?? null,
        errorMessage: truncatedError ?? null,
        finishedOn: new Date(),
      })
  } catch (err) {
    logger.warning('Failed to finish ReportDownloadLog entry', { err, logId, reLabel: 'aspect:report:downloadLog' })
  }
}

function finishReportDownloadLogInBackground(logId, payload) {
  finishReportDownloadLog(logId, payload).catch(() => null)
}

module.exports = {
  startReportDownloadLog,
  finishReportDownloadLog,
  finishReportDownloadLogInBackground,
}
