exports.up = async function (knex) {
  await knex.schema.table('AsyncReport', function (tbl) {
    tbl.dropColumn('dataConstraintsHash')
  })
}

exports.down = async function (knex) {
  await knex.schema.table('AsyncReport', function (tbl) {
    tbl.string('dataConstraintsHash', 32).notNullable().index()
  })
}
