exports.up = async function (knex) {
  return knex.schema.table('Device', table => {
    table.integer('gx6cModulesCount').nullable()
    table.integer('gx10cModulesCount').nullable()
  })
}

exports.down = async function (knex) {
  return knex.schema.table('Device', table => {
    table.dropColumn('gx6cModulesCount')
    table.dropColumn('gx10cModulesCount')
  })
}
