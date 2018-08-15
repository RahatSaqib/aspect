module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('Result', result => {
    result.unique(['externalId', 'deviceId'])
  })
}

async function down(knex) {
  await knex.schema.table('Result', result => {
    result.dropUnique(['externalId', 'deviceId'])
  })
}
