module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Result', t => {
    t.dropColumn('qcCheck')
  })
  await knex.schema.alterTable('DeviceLog', t => {
    t.dropColumn('checkpoint')
  })
}

async function down(knex) {
  await knex.schema.alterTable('Result', t => {
    t.boolean('qcCheck').notNullable().defaultTo(0)
  })
  await knex.schema.alterTable('DeviceLog', t => {
    t.string('checkpoint').index()
  })
}
