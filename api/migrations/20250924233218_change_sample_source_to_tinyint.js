exports.up = async function (knex) {
  // Drop and recreate Sample.source as tinyint unsigned with default 0
  knex.schema.alterTable('Sample', async function (table) {
    await table.dropColumn('source')
  })

  knex.schema.alterTable('Sample_AUDIT', async function (table) {
    await table.dropColumn('source')
  })
}

exports.down = async function (knex) {
  knex.schema.alterTable('Sample', async function (table) {
    await table.string('source', 35).nullable()
  })

  // Drop and recreate Sample_AUDIT.source as string
  knex.schema.alterTable('Sample_AUDIT', async function (table) {
    await table.string('source', 35).nullable()
  })
}
