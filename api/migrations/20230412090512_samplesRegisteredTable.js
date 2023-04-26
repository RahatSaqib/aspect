module.exports = require('../src/db').migration(up)

async function up(knex) {
  await knex.schema.alterTable('Sample', row => {
    row.specificType('sampleExtraData', 'JSON')
    row.string('sampleStatus')
    row.dateTime('updatedOn')
  })
}
