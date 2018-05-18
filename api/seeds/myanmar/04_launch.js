module.exports = require('../../src/db').seed(seed)

async function seed(knex) {
  await knex('Partner')
    .where({ name: 'Myanmar' })
    .update({ maxDaysDeviceNoResults: 14 })
}
