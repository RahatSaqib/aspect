const _ = require('lodash')
const { asyncHandler } = require('../routes')
const { getUtcTime } = require('../shared/date')
const { createSalt, encrypt } = require('../shared/encryption')
const { transact } = require('../db')
const { deviceRawMessagePosted, deviceRawMessageHandled } = require('./actions')

const addDeviceRawDataHandler = asyncHandler(async request => {
  const { auth = { credentials: { token: null } } } = request
  const { credentials: { token } } = auth
  const context = request.plugins.messageContext.bindActionCreators({
    deviceRawMessagePosted,
  })
  const salt = createSalt()
  const utcNow = getUtcTime()
  return transact(async knex => {
    const { id: deviceApiRawReadyStatusId } = await knex('DeviceApiRawStatus')
      .where('externalId', 'Ready')
      .first('id', 'externalId')
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
    context.deviceRawMessagePosted(deviceApiRawId)
    return deviceApiRawId
  })
})

async function onDeviceRawMessagePosted(
  { deviceApiRawId },
  { messageContext }
) {
  const context = messageContext.bindActionCreators({
    deviceRawMessageHandled,
  })
  return context.transact(async knex => {
    const rawMessage = await knex('DeviceApiRaw')
      .where('id', deviceApiRawId)
      .first()
    context.deviceRawMessageHandled(rawMessage.id)
  })
}

async function onDeviceRawMessageHandled(
  { deviceApiRawId },
  { messageContext }
) {
  return messageContext.transact(async knex => {
    const rawMessage = await knex('DeviceApiRaw')
      .where('id', deviceApiRawId)
      .first()
    console.log('onDeviceRawMessageHandled', deviceApiRawId, rawMessage)
  })
}

module.exports = {
  addDeviceRawDataHandler,
  onDeviceRawMessagePosted,
  onDeviceRawMessageHandled,
}
