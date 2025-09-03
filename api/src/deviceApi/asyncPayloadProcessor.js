const { knex } = require('../db')
const { deviceApiHandler } = require('./deviceApiHandler')
const { addDeviceDataWithContext } = require('./service')
const { devicePayloadValidation } = require('./validation')
const logger = require('../shared/logger')
const { asyncPayloadReceived } = require('./actions')

const onAsyncPayloadToProcess = async ({ deviceLogId }, { messageContext }) => {
  logger.info(`Processing async device payload for DeviceLogId: ${deviceLogId}`)
  const deviceLog = await knex('DeviceLog').where({ id: deviceLogId }).first('rawMessage')
  if (!deviceLog) {
    logger.warning(`DeviceLog with id ${deviceLogId} not found. Skipping.`)
    return
  }

  if (deviceLog.processed) {
    logger.warning(`DeviceLog with id ${deviceLogId} has already been marked as processed. Skipping.`)
    return
  }

  // Validate and format payload
  const { value: formattedPayload } = devicePayloadValidation.validate(JSON.parse(deviceLog.rawMessage), {
    allowUnknown: true,
  })

  // Build auth credentials
  const token = formattedPayload.deviceApiKey

  const key = await knex('DeviceApiKey as k')
    .leftJoin('Device as d', 'd.id', 'k.deviceId')
    .where({ 'k.token': token })
    .first('k.id as keyId', 'd.name as deviceName')

  const scope = ['deviceApi']
  const name = `(${key.keyId}) ${key.deviceName || ''}`.trim()
  const credentials = { token, scope, name, keyId: key.keyId }

  // Use original sync flow by simulating a hapi request
  const request = {
    plugins: { messageContext, rawPayload: formattedPayload },
    auth: { credentials },
    payload: formattedPayload,
  }
  const response = await deviceApiHandler(addDeviceDataWithContext, {}, false, deviceLogId)(request)
  logger.info(
    `Completed processing async device payload for DeviceLogId: ${deviceLogId}. Response: ${JSON.stringify(response)}`
  )
}

const asyncPayloadProcessorStartUp = async (queue, messageContext) => {
  messageContext.bindActionCreators({ asyncPayloadReceived })

  logger.info('Starting up async device payload processor, purging existing messages in queue')
  queue.purgeQueue('aspect_deviceApi_0_actions_ASYNC_PAYLOAD_RECEIVED')

  const deviceLogIds = await knex('DeviceLog').where({ processed: false }).select('id')
  for (const { id: deviceLogId } of deviceLogIds) {
    messageContext.asyncPayloadReceived(deviceLogId)
  }

  logger.info('Async device payload processor started')
}

module.exports = {
  onAsyncPayloadToProcess,
  asyncPayloadProcessorStartUp,
}
