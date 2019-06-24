module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('DeviceLog', dl => {
    dl.text('rawMessage', 'mediumtext').alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('DeviceLog', dl => {
    dl.text('rawMessage').alter()
  })
}
