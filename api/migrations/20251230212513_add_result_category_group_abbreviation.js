exports.up = async function (knex) {
  await knex.schema.alterTable('ResultCategoryGroup', table => {
    table.string('abbreviation', 20).nullable()
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('ResultCategoryGroup', table => {
    table.dropColumn('abbreviation')
  })
}
