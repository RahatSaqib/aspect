module.exports = require('../utils').seed(async knex => {
  await knex('DeviceApiKey').whereNotNull('username').update({ expiresOn: null })
}, __filename)
