const { updateDeviceConfiguration } = require('./shared/logic')
const { knex } = require('../../db')

const handlePingPayload = async (request, deviceLogId /* , remoteAddress */) => {
  const { auth, payload } = request
  const { devicesIds } = auth.credentials

  if (payload.configuration) {
    await updateDeviceConfiguration({ knex, payload, devicesIds, messageContext: request.plugins.messageContext })
  }

  await knex('DeviceLog').where('id', deviceLogId).update({
    processed: true,
  })

  return {}
}

module.exports = {
  handlePingPayload,
}
