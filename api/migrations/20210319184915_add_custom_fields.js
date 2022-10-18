module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Device', device => {
    device.dateTime('customFieldsSentOn').defaultTo(null)
  })
}

async function down(knex) {
  await knex.schema.alterTable('Device', device => {
    device.dropColumn('customFieldsSentOn')
  })
}
