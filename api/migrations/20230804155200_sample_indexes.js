async function up(knex) {
  await knex.schema.raw(`ALTER TABLE Sample ADD INDEX sample_externalId_index (externalId)`)
  await knex.schema.raw(`ALTER TABLE Sample ADD INDEX sample_registeredInAspect_index (registeredInAspect)`)
  await knex.schema.raw(`ALTER TABLE Sample ADD INDEX sample_collectedOn_index (collectedOn)`)
}

async function down(knex) {
  await knex.schema.alterTable('Sample', tbl => {
    tbl.dropIndex('', 'sample_externalId_index')
    tbl.dropIndex('', 'sample_registeredInAspect_index')
    tbl.dropIndex('', 'sample_collectedOn_index')
  })
}
module.exports = require('../src/db').migration(up, down)
