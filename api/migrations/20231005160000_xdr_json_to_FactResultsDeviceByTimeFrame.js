module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('FactResultsDeviceByTimeFrame', tbl => {
    tbl.specificType('xdrResistanceCounts', 'JSON')
  })
}

async function down(knex) {
  await knex.schema.alterTable('FactResultsDeviceByTimeFrame', tbl => {
    tbl.dropColumn('xdrResistanceCounts')
  })
}
