module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('DeviceLog', dl => {
    dl.text('rawMessage', 'mediumtext').alter()
  })
  await knex.schema.alterTable('Result', r => {
    r.text('rawData', 'mediumtext').alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('DeviceLog', dl => {
    dl.text('rawMessage').alter()
  })
  await knex.schema.alterTable('Result', r => {
    r.text('rawData').alter()
  })
}
