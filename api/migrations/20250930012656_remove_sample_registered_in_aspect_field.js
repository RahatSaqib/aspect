const { addAuditoryTriggers } = require('./utils/addAuditTriggers')

exports.up = async function (knex) {
  knex.schema.alterTable('Sample', async function (table) {
    await table.renameColumn('registeredInAspect', 'registeredInMobile')
  })

  knex.schema.alterTable('Sample_AUDIT', async function (table) {
    await table.renameColumn('registeredInAspect', 'registeredInMobile')
  })

  await addAuditoryTriggers(knex, 'Sample', 'Sample_AUDIT')
}

exports.down = async function (knex) {
  knex.schema.alterTable('Sample', async function (table) {
    await table.renameColumn('registeredInMobile', 'registeredInAspect')
  })

  // Drop and recreate Sample_AUDIT.source as string
  knex.schema.alterTable('Sample_AUDIT', async function (table) {
    await table.renameColumn('registeredInMobile', 'registeredInAspect')
  })

  await addAuditoryTriggers(knex, 'Sample', 'Sample_AUDIT')
}
