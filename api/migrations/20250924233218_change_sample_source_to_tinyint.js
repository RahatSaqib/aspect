exports.up = async function (knex) {
  // Drop and recreate Sample.source as tinyint unsigned with default 0
  knex.schema.alterTable('Sample', async function (table) {
    await table.dropColumn('source')
    await table.specificType('source', 'SMALLINT UNSIGNED').notNullable().defaultTo(0)
  })

  // Drop and recreate Sample_AUDIT.source as tinyint unsigned with default 0
  knex.schema.alterTable('Sample_AUDIT', async function (table) {
    await table.dropColumn('source')
    await table.specificType('source', 'SMALLINT UNSIGNED').nullable()
  })
}

exports.down = async function (knex) {
  knex.schema.alterTable('Sample', async function (table) {
    await table.dropColumn('source')
    await table.string('source', 35).nullable()
  })

  // Drop and recreate Sample_AUDIT.source as string
  knex.schema.alterTable('Sample_AUDIT', async function (table) {
    await table.dropColumn('source')
    await table.string('source', 35).nullable()
  })
}
