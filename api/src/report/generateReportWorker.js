const { workerData, parentPort } = require('worker_threads')
const { writeDataToFile } = require('../shared/io')
const { generateReport } = require('./serviceReports')

async function start() {
  const { externalId, query, auth, user, userPlaceHolders, fullPath, extension, sheets } = workerData

  const { dataBuffer, streamResponse } = await generateReport(
    externalId,
    query,
    auth,
    user,
    userPlaceHolders,
    extension,
    sheets
  )

  await writeDataToFile(fullPath, dataBuffer)

  parentPort.postMessage({ streamResponse })
}

start()
