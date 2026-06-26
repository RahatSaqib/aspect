const { addHours } = require('date-fns')
const { writeDataToFile } = require('../../shared/io')
const { updateAsyncReport } = require('../../shared/report')
const { generateReport } = require('../serviceReports')

const logger = require('../../shared/logger')

const { asyncReportStatusToId } = require('../../shared/dictionary')

const processAsyncReport = async reportPayload => {
  const { asyncReportId, externalId, query, auth, user, userPlaceHolders, fullPath, extension } = reportPayload

  try {
    await updateAsyncReport(asyncReportId, {
      statusId: await asyncReportStatusToId('processing'),
      startedOn: new Date(),
    })

    const startTime = Date.now()

    const { dataBuffer } = await generateReport(externalId, query, auth, user, userPlaceHolders, extension)

    await writeDataToFile(fullPath, dataBuffer)

    const endTime = Date.now()
    const generationTimeInMsec = endTime - startTime

    const expiresOn = addHours(new Date(), 2)

    await updateAsyncReport(asyncReportId, {
      statusId: await asyncReportStatusToId('ready'),
      filePath: fullPath,
      endedOn: new Date(),
      generationTimeInMsec,
      expiresOn,
    })

    // This is where we push to web socket
  } catch (err) {
    logger.error('Error generating report', err)
    await updateAsyncReport(asyncReportId, {
      statusId: await asyncReportStatusToId('error'),
      errorMessage: JSON.stringify(err),
    })
  }
}

module.exports = { processAsyncReport }
