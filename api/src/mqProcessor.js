const { addHours } = require('date-fns')
const { generateReport } = require('./report/serviceReports')
const { writeDataToFile } = require('./shared/io')
const logger = require('./shared/logger')
const { updateAsyncReport } = require('./shared/report')
const { asyncReportStatusToId } = require('./shared/dictionary')

const jobStrategies = {
  asyncReports: async job => {
    logger.debug(`job data: ${job.data}`)

    const { asyncReportId, externalId, query, auth, user, userPlaceHolders, fullPath, extension } = job.data

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
    return job.id
  },
  testJobName: async job => {
    // Test job will be removed after real job is added.
    logger.info('Test job name')
    return job.id
  },
  // Add more job strategies here
}

/**
 * Loading jobs from separate file to run jobs in isolated processes and not conflict with the main process.
 * Documentation here: https://docs.bullmq.io/guide/workers/sandboxed-processors
 */
module.exports = async job => {
  const strategy = jobStrategies[job.name]
  if (strategy) {
    return strategy(job)
  }
  return false
}
