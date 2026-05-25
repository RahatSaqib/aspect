module.exports = require('../utils').seed(async knex => {
  await knex('Device as d')
    .join('DeviceApiKey as dak', 'd.deviceApiKeyId', 'dak.id')
    .update('d.deviceApiKeyId', knex.raw('dak.id'))
}, __filename)
