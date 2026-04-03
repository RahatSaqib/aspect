const config = require('../../config')
const { processResultPayload } = require('../result/processResultPayload')
const { asyncPayloadReceived } = require('../actions')

const handleResultPayload = async (request, deviceLogId, remoteAddress) => {
  const response = config.enableAsyncPayloadProcessing
    ? await enqueueResultPayload(request, deviceLogId, remoteAddress)
    : await processResultPayload(request, deviceLogId, remoteAddress)

  return response
}

async function enqueueResultPayload(request, deviceLogId) {
  // Add to queue for processing
  const { messageContext } = request.plugins
  messageContext.bindActionCreators({ asyncPayloadReceived })
  messageContext.asyncPayloadReceived(deviceLogId)

  // Respond immediately to device — result will be processed asynchronously, so aspectResultId and deviceId are not yet available
  return {}
}

module.exports = {
  handleResultPayload,
}
