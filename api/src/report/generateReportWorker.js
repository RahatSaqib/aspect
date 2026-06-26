const XlsxPopulate = require('xlsx-populate')
const { workerData, parentPort } = require('worker_threads')
const { writeDataToFile } = require('../shared/io')
const { generateReport } = require('./serviceReports')
const logger = require('../shared/logger')

async function start() {
  const { externalId, query, auth, user, userPlaceHolders, fullPath, extension, reportPassword } = workerData

  async function passwordReportFile(filePath, password) {
    try {
      const workbook = await XlsxPopulate.fromFileAsync(filePath)
      const decryptedPassword = Buffer.from(password, 'base64').toString('utf-8')
      await workbook.toFileAsync(filePath, { password: decryptedPassword })
    } catch (err) {
      logger.error('Error creating password-protected Excel:', err)
    }
  }

  try {
    const { dataBuffer, streamResponse, dataQueryTimeSeconds, fileGenerationTimeSeconds } = await generateReport(
      externalId,
      query,
      auth,
      user,
      userPlaceHolders,
      extension
    )

    await writeDataToFile(fullPath, dataBuffer)

    // If a password is provided, and report is excel, password protect the file
    if (reportPassword && extension === 'xlsx') {
      await passwordReportFile(fullPath, reportPassword)
    }

    parentPort.postMessage({
      success: true,
      streamResponse,
      dataQueryTimeSeconds,
      fileGenerationTimeSeconds,
    })
  } catch (err) {
    parentPort.postMessage({ error: err.message })
  }
}

start()
