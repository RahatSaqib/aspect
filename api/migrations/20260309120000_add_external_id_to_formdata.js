exports.up = async function (knex) {
  await knex.schema.alterTable('FormData', table => {
    table.string('externalId', 36).nullable().index()
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('FormData', table => {
    table.dropColumn('externalId')
  })
}
