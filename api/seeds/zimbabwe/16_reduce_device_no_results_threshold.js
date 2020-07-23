module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await knex('Partner')
    .where('name', 'Zimbabwe')
    .update({ maxDaysDeviceOffline: 1, maxDaysDeviceNoResults: 1 })
}
