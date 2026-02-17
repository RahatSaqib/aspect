const _ = require('lodash')

const { knex } = require('../db')
const { getRemoteAddress } = require('../shared/request')

async function addDeviceLog(request, h, error) {
  await updateLogs(request)
  return error
}

async function updateLogs(request) {
  const { auth } = request

  await knex('DeviceLog').insert({
    deviceApiKeyId: auth.credentials.deviceApiKeyId,
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
