exports.up = async function (knex) {
  const hasFormDataTable = await knex.schema.hasTable('FormData')
  if (!hasFormDataTable) {
    return
  }

  const hasExternalIdColumn = await knex.schema.hasColumn('FormData', 'externalId')
  if (!hasExternalIdColumn) {
    await knex.schema.alterTable('FormData', table => {
      table.string('externalId', 36).nullable().index()
    })
  }
}

exports.down = async function (knex) {
  const hasFormDataTable = await knex.schema.hasTable('FormData')
  if (!hasFormDataTable) {
    return
  }

  const hasExternalIdColumn = await knex.schema.hasColumn('FormData', 'externalId')
  if (hasExternalIdColumn) {
    await knex.schema.alterTable('FormData', table => {
      table.dropColumn('externalId')
    })
  }
}
