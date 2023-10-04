exports.up = async function (knex) {
  return knex.schema.table('Person', table => {
    table.string('phoneE164', 255)
    table.string('cellE164', 255)
  })
}

exports.down = async function (knex) {
  return knex.schema.table('Person', table => {
    table.dropColumn('phoneE164')
    table.dropColumn('cellE164')
  })
}
