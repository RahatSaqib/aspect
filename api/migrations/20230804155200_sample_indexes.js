async function up(knex) {
  await knex.schema.alterTable('Sample', tbl => {
    tbl.string('externalId').index('sample_externalId_index').alter()
    tbl.bool('registeredInAspect').index('sample_registeredInAspect_index').alter()
    tbl.dateTime('collectedOn').index('sample_collectedOn_index').alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Sample', tbl => {
    tbl.dropIndex('', 'sample_externalId_index')
    tbl.dropIndex('', 'sample_registeredInAspect_index')
    tbl.dropIndex('', 'sample_collectedOn_index')
  })
}
module.exports = require('../src/db').migration(up, down)
