module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('DeviceApiKey', dak => {
    dak.string('username').unique()
    dak.string('password', 128)
    dak.datetime('expiresOn')
  })
}

async function down(knex) {
  await knex.schema.table('DeviceApiKey', dak => {
    dak.dropColumns('username', 'password', 'expiresOn')
  })
}
