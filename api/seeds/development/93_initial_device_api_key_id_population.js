module.exports = require('../utils').seed(async knex => {
  await knex('Device as d')
    .join('DeviceApiKey as dak', 'd.id', 'dak.deviceId')
    .update('d.deviceApiKeyId', knex.raw('dak.id'))

  await knex('Result as r')
    .join('Device as d', 'r.deviceId', 'd.id')
    .update('r.deviceApiKeyId', knex.raw('d.deviceApiKeyId'))
}, __filename)
