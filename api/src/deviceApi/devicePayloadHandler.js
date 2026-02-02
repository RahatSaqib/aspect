const _ = require('lodash')
const { knex } = require('../db')
const { getRemoteAddress } = require('../shared/request')
const { removeAdditionalData } = require('../result/common/logic')
const { normalizeToken } = require('./apiKey')
const { asyncPayloadReceived } = require('./actions')
const config = require('../config')
const { processPayload } = require('./processPayload')

const devicePayloadHandler = async request => {
  const isResultPayload = !!request.payload?.result
  const shouldProcessAsync = config.enableAsyncPayloadProcessing && isResultPayload

  const remoteAddress = getRemoteAddress(request)

  const deviceLogId = await createDeviceLog(request, remoteAddress)

  const response = shouldProcessAsync
    ? await processAsyncPayload(request, deviceLogId, remoteAddress)
    : await processPayload(request, deviceLogId, remoteAddress)

  return response
}

async function createDeviceLog(request, remoteAddress) {
  const formattedResult = removeAdditionalData(request.plugins.rawPayload)
  formattedResult.deviceApiKey = normalizeToken(request.auth.credentials.token)
  const deviceLogRawMessage = JSON.stringify(formattedResult)
  const now = new Date()

  const [deviceLogId] = await knex('DeviceLog').insert({
    deviceId: null,
    source: _.get(request.payload, 'log.source', ''),
    createdOn: now,
    senderIp: remoteAddress,
    rawMessage: deviceLogRawMessage,
    processed: false,
  })

  return deviceLogId
}

async function processAsyncPayload(request, deviceLogId) {
  // Add to queue for processing
  const { messageContext } = request.plugins
  messageContext.bindActionCreators({ asyncPayloadReceived })
  messageContext.asyncPayloadReceived(deviceLogId)
}

module.exports = {
  devicePayloadHandler,
}
