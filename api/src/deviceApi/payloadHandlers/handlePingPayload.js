const { updateDeviceConfiguration } = require('./shared/logic')
const { knex } = require('../../db')

const handlePingPayload = async (request, deviceLogId, remoteAddress) => {
  const { auth, payload } = request
  const { deviceIds } = auth.credentials

  if (payload.configuration) {
    await updateDeviceConfiguration({
      knex,
      payload,
      deviceIds,
      messageContext: request.plugins.messageContext,
      remoteAddress,
    })
  }

  await knex('DeviceLog').where('id', deviceLogId).update({
    processed: true,
  })

  return {}
}

module.exports = {
  handlePingPayload,
}
