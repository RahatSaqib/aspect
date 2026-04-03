const _ = require('lodash')
const { knex } = require('../db')
const { getRemoteAddress } = require('../shared/request')
const { removeAdditionalData } = require('../result/common/logic')
const { normalizeToken } = require('./apiKey')
const { handleResultPayload } = require('./payloadHandlers/handleResultPayload')
const { handleLogPayload } = require('./payloadHandlers/handleLogPayload')
const { handleDailyDetailsPayload } = require('./payloadHandlers/handleDailyDetailsPayload')
const { handlePingPayload } = require('./payloadHandlers/handlePingPayload')
const { handleInventoryOperationPayload } = require('./payloadHandlers/handleInventoryOperationPayload')

const handlers = {
  RESULT: handleResultPayload,
  LOG: handleLogPayload,
  DAILY_DETAILS: handleDailyDetailsPayload,
  PING: handlePingPayload,
  INVENTORY_OPERATION: handleInventoryOperationPayload,
}

const devicePayloadHandler = async request => {
  const remoteAddress = getRemoteAddress(request)
  const payloadType = detectPayloadType(request.payload)

  const deviceLogId = await createDeviceLog(request, remoteAddress, payloadType)

  const handler = handlers[payloadType]
  if (!handler) {
    throw new Error(`Unknown payload type: ${payloadType} deviceLogId: ${deviceLogId}`)
  }

  return handler(request, deviceLogId, remoteAddress)
}

function detectPayloadType(payload) {
  if (payload.result) return 'RESULT'
  if (payload.log) return 'LOG'
  if (payload.includeDeviceConfiguration === true) return 'DAILY_DETAILS'
  if (payload.includeDeviceConfiguration === false && payload.operation) return 'INVENTORY_OPERATION'
  if (payload.includeDeviceConfiguration === false && !payload.result && !payload.log && !payload.operation)
    return 'PING'
  return 'UNKNOWN'
}

async function createDeviceLog(request, remoteAddress, payloadType) {
  const formattedResult = removeAdditionalData(request.plugins.rawPayload)
  const deviceApiKey = normalizeToken(request.auth.credentials.token)
  formattedResult.deviceApiKey = deviceApiKey
  const deviceLogRawMessage = JSON.stringify(formattedResult)
  const now = new Date()

  const [deviceLogId] = await knex('DeviceLog').insert({
    deviceApiKeyId: request.auth.credentials.deviceApiKeyId,
    type: payloadType,
    source: _.get(request.payload, 'log.source', ''),
    createdOn: now,
    senderIp: remoteAddress,
    rawMessage: deviceLogRawMessage,
    processed: false,
  })

  return deviceLogId
}

module.exports = {
  devicePayloadHandler,
}
