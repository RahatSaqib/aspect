exports.up = async function (knex) {
  await knex.schema.alterTable('Country', t => {
    t.string('defaultTimeZoneIANA', 60)
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Country', tbl => {
    tbl.dropColumn('defaultTimeZoneIANA')
  })
}
