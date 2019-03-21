const _ = require('lodash')
const Boom = require('boom')
const Promise = require('bluebird')
const { asyncHandler } = require('../routes')
const { getUtcTime } = require('../shared/date')
const { createSalt, encrypt, decrypt } = require('../shared/encryption')
const { knex } = require('../db')
const {
  types,
  deviceRawMessagePosted,
  deviceRawMessageResponseReady,
  deviceRawMessageProcessed,
  deviceRawMessageError,
} = require('./actions')
const { loadRawDataProcessor } = require('./dataProcessors/registration')

const addDeviceRawDataHandler = asyncHandler(async request => {
  const {
    auth = { credentials: { token: null } },
    plugins: { messageContext },
  } = request
  const context = messageContext.bindActionCreators({
    deviceRawMessagePosted,
  })
  const { credentials: { token } } = auth
  const salt = createSalt()
  const utcNow = getUtcTime()
  const { id: deviceApiRawReadyStatusId } = await knex('DeviceApiRawStatus')
    .where('externalId', 'Ready')
    .first('id')
  const deviceApiKey = await knex('DeviceApiKey')
    .where({ token })
    .first()
  const [deviceApiRawId] = await knex('DeviceApiRaw').insert({
    rawData: encrypt(
      JSON.stringify(
        _.pick(
          request,
          'url',
          'query',
          'path',
          'method',
          'mime',
          'headers',
          'info',
          'id',
          'app',
          'auth',
          'params',
          'paramsArray',
          'payload'
        )
      ),
      salt
    ),
    salt,
    deviceApiKeyId: deviceApiKey.id,
    deviceApiKeySnapshot: JSON.stringify(deviceApiKey),
    deviceApiRawStatusId: deviceApiRawReadyStatusId,
    createdOn: utcNow,
    updatedOn: utcNow,
  })
  const timeoutMilliseconds = 60000
  const timeoutMessage = 'Timeout waiting for raw message to be handled'
  const responseReady = context.queue
    .waitForAction(
      { type: types.DEVICE_RAW_MESSAGE_RESPONSE_READY, deviceApiRawId },
      timeoutMilliseconds,
      timeoutMessage
    )
    .then(action => action.response)
  const error = context.queue
    .waitForAction(
      { type: types.DEVICE_RAW_MESSAGE_ERROR, deviceApiRawId },
      timeoutMilliseconds,
      timeoutMessage
    )
    .then(action => {
      if (_.get(action, 'error.isBoom')) {
        const errorPayload = _.get(action, 'error.output.payload', {})
        const statusCode =
          _.get(action, 'error.output.statusCode') ||
          _.get(errorPayload, 'statusCode')
        const error = Boom.boomify(new Error(_.get(errorPayload, 'message')), {
          statusCode,
        })
        if (_.get(action, 'error.data')) {
          error.data = _.get(action, 'error.data')
        }
        throw error
      }
      throw action.error
    })
  context.deviceRawMessagePosted(deviceApiRawId)
  return Promise.race([responseReady, error]).catch(error => {
    if (_.get(error, 'message') === timeoutMessage) {
      throw Boom.gatewayTimeout(timeoutMessage, {
        deviceApiRawId,
        timeoutMilliseconds,
      })
    }
    throw error
  })
})

async function onDeviceRawMessagePosted(
  { deviceApiRawId },
  { messageContext }
) {
  const context = messageContext.bindActionCreators({
    deviceRawMessageResponseReady,
    deviceRawMessageProcessed,
    deviceRawMessageError,
  })
  try {
    const { id: deviceApiRawLockedStatusId } = await knex('DeviceApiRawStatus')
      .where('externalId', 'Locked')
      .first('id')
    const encryptedRawMessage = await knex('DeviceApiRaw')
      .where('id', deviceApiRawId)
      .first()
    if (
      encryptedRawMessage.deviceApiRawStatusId === deviceApiRawLockedStatusId
    ) {
      throw Boom.locked(
        'The raw message record has already been locked for processing',
        { deviceApiRawId }
      )
    }
    const decryptedRawRequestObject = {
      id: encryptedRawMessage.id,
      rawData: JSON.parse(
        decrypt(encryptedRawMessage.rawData, encryptedRawMessage.salt)
      ),
      deviceApiKeySnapshot: JSON.parse(
        encryptedRawMessage.deviceApiKeySnapshot
      ),
      createdOn: encryptedRawMessage.createdOn,
      updatedOn: encryptedRawMessage.updatedOn,
    }
    const dataProcessor = await loadRawDataProcessor(
      decryptedRawRequestObject,
      context
    )
    await knex('DeviceApiRaw')
      .where('id', deviceApiRawId)
      .update({
        deviceApiRawStatusId: deviceApiRawLockedStatusId,
        dataProcessor: dataProcessor.name,
        updatedOn: getUtcTime(),
      })
    await dataProcessor.processRequest()
  } catch (error) {
    context.deviceRawMessageError(deviceApiRawId, error)
  }
}

async function onDeviceRawMessageProcessed({ deviceApiRawId }) {
  const { id: deviceApiRawProcessedStatusId } = await knex('DeviceApiRawStatus')
    .where('externalId', 'Processed')
    .first('id')
  await knex('DeviceApiRaw')
    .where('id', deviceApiRawId)
    .update({
      deviceApiRawStatusId: deviceApiRawProcessedStatusId,
      updatedOn: getUtcTime(),
    })
}

async function onDeviceRawMessageError({ deviceApiRawId }) {
  const { id: deviceApiRawErrorStatusId } = await knex('DeviceApiRawStatus')
    .where('externalId', 'Error')
    .first('id')
  await knex('DeviceApiRaw')
    .where('id', deviceApiRawId)
    .update({
      deviceApiRawStatusId: deviceApiRawErrorStatusId,
      updatedOn: getUtcTime(),
    })
}

module.exports = {
  addDeviceRawDataHandler,
  onDeviceRawMessagePosted,
  onDeviceRawMessageProcessed,
  onDeviceRawMessageError,
}
