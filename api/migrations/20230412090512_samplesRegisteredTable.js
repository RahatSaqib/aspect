module.exports = require('../src/db').migration(up)

async function up(knex) {
  await knex.schema.alterTable('Sample', table => {
    table.specificType('sampleData', 'JSON')
    table.string('sampleStatus')
    table.integer('updatedBy')
    table.dateTime('updatedOn')
    table.string('collectedBy')
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Sample', table => {
    table.dropColumn('sampleData')
    table.dropColumn('sampleStatus')
    table.dropColumn('updatedBy')
    table.dropColumn('updatedOn')
    table.dropColumn('collectedBy')
  })
}
