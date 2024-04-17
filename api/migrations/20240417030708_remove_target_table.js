exports.up = async function (knex) {
  await knex.schema.dropTable('Target')
}

exports.down = async function (knex) {
  await knex.schema.dropTable('Target')
}
