module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('DeviceConfiguration', table => {
    table.dropForeign(['geographyId'])
    table.dropColumn('geographyId')
  })
}

async function down(knex) {
  await knex.schema.alterTable('DeviceConfiguration', table => {
    table.integer('geographyId').unsigned().references('id').inTable('Geography')
  })
}
