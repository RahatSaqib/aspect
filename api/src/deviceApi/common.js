const { knex }  = require('../db')

function* getDeviceByApiKeyId(request, fields=['d.id']){
  const {auth} = request
  const devices = yield knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .where({
      'dak.id': +auth.credentials.dak,
      'dak.revoked': false
    })
    .select(fields)
  return {ok: devices.length === 1, data: devices[0]}
}

module.exports = {
  getDeviceByApiKeyId
}
