const { workerData, parentPort } = require('worker_threads')
const { writeDataToFile } = require('../shared/io')
const { generateReport } = require('./serviceReports')

async function start() {
  const { externalId, query, auth, user, userPlaceHolders, fullPath, extension } = workerData

  try {
    const { dataBuffer, streamResponse } = await generateReport(
      externalId,
      query,
      auth,
      user,
      userPlaceHolders,
      extension
    )

    await writeDataToFile(fullPath, dataBuffer)

    parentPort.postMessage({ success: true, streamResponse })
  } catch (err) {
    parentPort.postMessage({ error: err.message })
  }
}

start()
