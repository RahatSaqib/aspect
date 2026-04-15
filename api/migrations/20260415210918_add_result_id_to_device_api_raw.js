module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('DeviceApiRaw', table => {
    table.integer('resultId').unsigned().nullable().references('id').inTable('Result').onDelete('SET NULL')
    table.index('resultId')
  })
}

async function down(knex) {
  await knex.schema.table('DeviceApiRaw', table => {
    table.dropIndex('resultId')
    table.dropColumn('resultId')
  })
}
