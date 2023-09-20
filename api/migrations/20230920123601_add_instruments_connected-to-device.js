exports.up = async function (knex) {
  return knex.schema.table('Device', table => {
    table.integer('instrumentsConnected', 4).defaultTo(1)
  })
}

exports.down = async function (knex) {
  return knex.schema.table('Device', table => {
    table.dropColumn('instrumentsConnected')
  })
}
