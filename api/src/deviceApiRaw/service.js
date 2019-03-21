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
  deviceRawMessageProcessed,
  deviceRawMessageError,
} = require('./actions')

const addDeviceRawDataHandler = asyncHandler(async request => {
  const { auth = { credentials: { token: null } } } = request
  const { credentials: { token } } = auth
  const context = request.plugins.messageContext.bindActionCreators({
    deviceRawMessagePosted,
  })
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
  const processed = context.queue
    .waitForAction(
      { type: types.DEVICE_RAW_MESSAGE_PROCESSED, deviceApiRawId },
      timeoutMilliseconds,
      timeoutMessage
    )
    .then(action => {
      return action.response || deviceApiRawId
    })
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
  return Promise.race([processed, error]).catch(error => {
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
    await knex('DeviceApiRaw')
      .where('id', deviceApiRawId)
      .update({ deviceApiRawStatusId: deviceApiRawLockedStatusId })

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
    const dataProcessorPlugin = await loadPlugin(decryptedRawRequestObject)
    const response = await dataProcessorPlugin.processRequest()

    context.deviceRawMessageProcessed(deviceApiRawId, response)
  } catch (error) {
    context.deviceRawMessageError(deviceApiRawId, error)
  }
}

async function loadPlugin(decrypteDeviceApiRaw) {
  // TODO: Implement matching predicates based on contents of request
  return Promise.resolve({
    processRequest: async () => {
      console.log(decrypteDeviceApiRaw)
      return Promise.resolve(decrypteDeviceApiRaw.id)
    },
  })
}

// TODO: Save the name of the plugin that was used to process this data
async function onDeviceRawMessageProcessed({ deviceApiRawId }) {
  const { id: deviceApiRawProcessedStatusId } = await knex('DeviceApiRawStatus')
    .where('externalId', 'Processed')
    .first('id')
  await knex('DeviceApiRaw')
    .where('id', deviceApiRawId)
    .update({ deviceApiRawStatusId: deviceApiRawProcessedStatusId })
}

async function onDeviceRawMessageError({ deviceApiRawId }) {
  const { id: deviceApiRawErrorStatusId } = await knex('DeviceApiRawStatus')
    .where('externalId', 'Error')
    .first('id')
  await knex('DeviceApiRaw')
    .where('id', deviceApiRawId)
    .update({ deviceApiRawStatusId: deviceApiRawErrorStatusId })
}

module.exports = {
  addDeviceRawDataHandler,
  onDeviceRawMessagePosted,
  onDeviceRawMessageProcessed,
  onDeviceRawMessageError,
}
