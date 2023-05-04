module.exports = require('../src/db').migration(up)

async function up(knex) {
  await knex.schema.alterTable('Sample', row => {
    row.specificType('sampleData', 'JSON')
    row.string('sampleStatus')
    row.string('updatedBy')
    row.dateTime('updatedOn')
    row.dateTime('collectedBy')
  })
}
