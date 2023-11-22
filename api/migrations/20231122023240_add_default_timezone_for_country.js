exports.up = async function (knex) {
  await knex.schema.alterTable('Country', t => {
    t.string('defaultTimeZone', 50)
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Country', tbl => {
    tbl.dropColumn('defaultTimeZone')
  })
}
