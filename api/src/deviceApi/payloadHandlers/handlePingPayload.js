const { updateDeviceConfiguration } = require('./shared/logic')
const { knex } = require('../../db')
const { deviceSeen } = require('../../device/actions')

const handlePingPayload = async (request, deviceLogId, remoteAddress) => {
  const { auth, payload } = request
  const { deviceIds } = auth.credentials
  const { messageContext } = request.plugins

  if (payload.configuration) {
    await updateDeviceConfiguration({
      knex,
      payload,
      deviceIds,
      messageContext,
      remoteAddress,
    })

    messageContext.bindActionCreators({ deviceSeen })
    deviceIds.forEach(deviceId => messageContext.deviceSeen(deviceId))
  }

  await knex('DeviceLog').where('id', deviceLogId).update({
    processed: true,
  })

  return {}
}

module.exports = {
  handlePingPayload,
}
