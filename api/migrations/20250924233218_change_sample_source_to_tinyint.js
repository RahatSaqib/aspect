exports.up = async function (knex) {
  await knex.schema.alterTable('Sample', async function (table) {
    table.dropColumn('source')
  })

  await knex.schema.alterTable('Sample_AUDIT', async function (table) {
    table.dropColumn('source')
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Sample', async function (table) {
    table.string('source', 35).nullable()
  })

  // Drop and recreate Sample_AUDIT.source as string
  await knex.schema.alterTable('Sample_AUDIT', async function (table) {
    table.string('source', 35).nullable()
  })
}
