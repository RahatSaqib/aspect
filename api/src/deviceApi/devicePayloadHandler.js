const _ = require('lodash')
const { knex } = require('../db')
const { getRemoteAddress } = require('../shared/request')
const { removeAdditionalData } = require('../result/common/logic')
const { deviceApiHandler } = require('./deviceApiHandler')
const { addDeviceDataWithContext } = require('./service')
const { normalizeToken } = require('./apiKey')
const { asyncPayloadReceived } = require('./actions')
const config = require('../config')

const devicePayloadHandler = async request => {
  const isResultPayload = !!request.payload?.result

  if (!config.enableAsyncPayloadProcessing || !isResultPayload) {
    const response = await deviceApiHandler(addDeviceDataWithContext)(request)
    return response
  }

  // Async processing of payload
  const formattedResult = removeAdditionalData(request.plugins.rawPayload)
  formattedResult.deviceApiKey = normalizeToken(request.auth.credentials.token)
  const deviceLogRawMessage = JSON.stringify(formattedResult)
  const remoteAddress = getRemoteAddress(request)
  const now = new Date()

  const [deviceLogId] = await knex('DeviceLog').insert({
    deviceId: null,
    source: _.get(request.payload, 'log.source', ''),
    createdOn: now,
    senderIp: remoteAddress,
    rawMessage: deviceLogRawMessage,
    processed: false,
  })

  // Add to queue for processing
  const { messageContext } = request.plugins
  messageContext.bindActionCreators({ asyncPayloadReceived })
  messageContext.asyncPayloadReceived(deviceLogId)

  const response = { deviceLogId }
  return response
}

module.exports = {
  devicePayloadHandler,
}
