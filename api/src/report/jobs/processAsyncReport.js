const fs = require('fs')
const { addHours } = require('date-fns')
const { writeDataToFile } = require('../../shared/io')
const { updateAsyncReport } = require('../../shared/report')
const { generateReport } = require('../serviceReports')
const { startReportDownloadLog, finishReportDownloadLog } = require('../reportDownloadLog')

const logger = require('../../shared/logger')

const { asyncReportStatusToId } = require('../../shared/dictionary')

const processAsyncReport = async reportPayload => {
  const { asyncReportId, externalId, query, auth, user, userPlaceHolders, fullPath, extension } = reportPayload

  const logId = await startReportDownloadLog({
    userName: user?.name,
    reportExternalId: externalId,
    format: query.format || extension,
    query,
    source: 'async_generate',
    asyncReportId,
  })

  const startTime = Date.now()

  try {
    await updateAsyncReport(asyncReportId, {
      statusId: await asyncReportStatusToId('processing'),
      startedOn: new Date(),
    })

    const { dataBuffer } = await generateReport(externalId, query, auth, user, userPlaceHolders, extension)

    await writeDataToFile(fullPath, dataBuffer)

    const generationTimeInMsec = Date.now() - startTime
    const { size: fileSizeBytes } = await fs.promises.stat(fullPath)

    const expiresOn = addHours(new Date(), 2)

    await updateAsyncReport(asyncReportId, {
      statusId: await asyncReportStatusToId('ready'),
      filePath: fullPath,
      endedOn: new Date(),
      generationTimeInMsec,
      expiresOn,
    })

    await finishReportDownloadLog(logId, {
      success: 1,
      generationTimeMs: generationTimeInMsec,
      fileSizeBytes,
    })

    // This is where we push to web socket
  } catch (err) {
    logger.error('Error generating report', err)
    await updateAsyncReport(asyncReportId, {
      statusId: await asyncReportStatusToId('error'),
      errorMessage: JSON.stringify(err),
    })
    await finishReportDownloadLog(logId, {
      success: 0,
      generationTimeMs: Date.now() - startTime,
      errorMessage: err?.message || JSON.stringify(err),
    })
  }
}

module.exports = { processAsyncReport }
