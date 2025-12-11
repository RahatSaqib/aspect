exports.up = async function (knex) {
  await knex.schema.alterTable('JobContext', table => {
    table.integer('tagId').nullable().unsigned().index().references('id').inTable('Tag')
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('JobContext', table => {
    table.dropForeign('tagId')
    table.dropColumn('tagId')
  })
}
