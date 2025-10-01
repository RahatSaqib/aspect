const { addAuditoryTriggers } = require('./utils/addAuditTriggers')

exports.up = async function (knex) {
  // Drop the index first
  await knex.schema.table('Sample', table => {
    table.dropIndex('', 'sample_registeredInAspect_index')
  })

  // Rename the column
  await knex.schema.table('Sample', table => {
    table.renameColumn('registeredInAspect', 'registeredInMobile')
  })

  // Recreate the index with new name
  await knex.schema.table('Sample', table => {
    table.boolean('registeredInMobile').index('sample_registeredInMobile_index').alter()
  })

  // Rename in audit table
  await knex.schema.table('Sample_AUDIT', table => {
    table.renameColumn('registeredInAspect', 'registeredInMobile')
  })

  await addAuditoryTriggers(knex, 'Sample', 'Sample_AUDIT')
}

exports.down = async function (knex) {
  // Drop the index first
  await knex.schema.table('Sample', table => {
    table.dropIndex('', 'sample_registeredInMobile_index')
  })

  // Rename the column back
  await knex.schema.table('Sample', table => {
    table.renameColumn('registeredInMobile', 'registeredInAspect')
  })

  // Recreate the index with original name
  await knex.schema.table('Sample', table => {
    table.boolean('registeredInAspect').index('sample_registeredInAspect_index').alter()
  })

  // Rename in audit table
  await knex.schema.table('Sample_AUDIT', table => {
    table.renameColumn('registeredInMobile', 'registeredInAspect')
  })

  await addAuditoryTriggers(knex, 'Sample', 'Sample_AUDIT')
}
