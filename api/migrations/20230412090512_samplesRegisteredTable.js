module.exports = require('../src/db').migration(up)

async function up(knex) {
  await knex.schema.alterTable('Sample', row => {
    row.specificType('sampleData', 'JSON')
    row.string('sampleStatus')
    row.integer('updatedBy')
    row.dateTime('updatedOn')
    row.dateTime('collectedBy')
  })
}
