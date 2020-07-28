module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('DeviceType', deviceType => {
    deviceType.unique(['externalId'])
  })
}

async function down(knex) {
  await knex.schema.alterTable('DeviceType', deviceType => {
    deviceType.dropUnique(['externalId'])
  })
}
