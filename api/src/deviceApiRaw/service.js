const _ = require('lodash')
const Boom = require('boom')
const Promise = require('bluebird')
const { asyncHandler } = require('../routes')
const { getUtcTime } = require('../shared/date')
const { createSalt, encrypt } = require('../shared/encryption')
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
  const processed = context.queue
    .waitForAction({ type: types.DEVICE_RAW_MESSAGE_PROCESSED })
    .then(action => action.response || deviceApiRawId)
  const error = context.queue
    .waitForAction({ type: types.DEVICE_RAW_MESSAGE_ERROR })
    .then(action => {
      throw action.error
    })
  context.deviceRawMessagePosted(deviceApiRawId)
  return Promise.race([processed, error]).catch(error => {
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
    await knex('DeviceApiRaw')
      .where('id', deviceApiRawId)
      .update({ deviceApiRawStatusId: deviceApiRawLockedStatusId })

    // This is where the processing will happen
    const response = { value: 'this is the response ' }
    if (deviceApiRawId % 2) {
      throw Boom.badRequest(
        'Only even numbered raw messages will be processed',
        deviceApiRawId
      )
    }

    context.deviceRawMessageProcessed(deviceApiRawId, response)
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
