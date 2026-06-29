const { Worker } = require('worker_threads')
const { getUserFromCredentials } = require('../auth/constraints')
const { getContentDispositionFilename } = require('../shared/io')
const { getReportDetails } = require('./service')

/**
 * Execute a report and save it to disk.
 * @param {Object} auth - auth like object with personId and credentials
 * @param {Object} query - query params
 * @param {string} externalId - externalId of the report
 */
async function saveReportToFile(auth, query, externalId, useUserPlaceHolders = false, reportPassword = undefined) {
  const user = await getUserFromCredentials(auth.credentials)

  const { fileNamePrefix, exportExcel } = await getReportDetails(externalId, { personId: user.personId })

  // default to `xlsx`, notice that query validation allows only 'xlsx', 'csv', or empty/no param
  const extension = query.format === 'csv' || !exportExcel ? 'csv' : 'xlsx'
  const fileName = getContentDispositionFilename(fileNamePrefix, extension)

  // Reports needs a valid user. While sending notification we have a group of user,
  // so we keep userPlaceHolders empty to avoid show personal user data
  const userPlaceHolders = useUserPlaceHolders
    ? {
        email: user.email,
        cell: user.cell,
      }
    : {}

  // TODO: Replace /tmp for an environment variable.
  const fullPath = `/tmp/${fileName}`

  const worker = new Worker('./src/report/generateReportWorker.js', {
    resourceLimits: {
      maxOldGenerationSizeMb: 8192,
    },
    workerData: {
      externalId,
      query,
      auth,
      user,
      userPlaceHolders,
      fullPath,
      extension,
      reportPassword,
    },
  })

  const promise = new Promise((resolve, reject) => {
    worker.on('message', response => {
      if (response.error) {
        return reject(response.error)
      }
      return resolve({
        fullPath,
        dataQueryTimeMs: response.dataQueryTimeMs,
        fileGenerationTimeMs: response.fileGenerationTimeMs,
      })
    })
  })

  return { fileName, extension, promise }
}

module.exports = {
  saveReportToFile,
}
