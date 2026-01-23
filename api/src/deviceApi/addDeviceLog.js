const _ = require('lodash')

const { knex } = require('../db')
const { getRemoteAddress } = require('../shared/request')

async function addDeviceLog(request, h, error) {
  await updateLogs(request)
  return error
}

async function updateLogs(request) {
  const { auth } = request
  const device = await knex('DeviceApiKey as k')
    .innerJoin('Device as d', 'k.deviceId', 'd.id')
    .where('k.token', auth.credentials.token)
    .first('d.id')

  await knex('DeviceLog').insert({
    deviceId: (device && device.id) || null,
    resultId: null,
    source: _.get(request.payload, 'log.source', ''),
    createdOn: new Date(),
    senderIp: getRemoteAddress(request),
    rawMessage: JSON.stringify(request.plugins.rawPayload),
  })
}

module.exports = {
  addDeviceLog,
}
