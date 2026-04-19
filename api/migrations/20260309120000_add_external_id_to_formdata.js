exports.up = async function (knex) {
  const hasExternalIdColumn = await knex.schema.hasColumn('FormData', 'externalId')
  if (!hasExternalIdColumn) {
    await knex.schema.alterTable('FormData', table => {
      table.string('externalId', 36).nullable().index()
    })
  }
}

exports.down = async function (knex) {
  const hasExternalIdColumn = await knex.schema.hasColumn('FormData', 'externalId')
  if (hasExternalIdColumn) {
    await knex.schema.alterTable('FormData', table => {
      table.dropColumn('externalId')
    })
  }
}
