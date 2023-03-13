exports.up = async function (knex) {
  await knex.schema.alterTable('ResultType', tbl => {
    tbl.bool('excluded').notNullable().default(false)
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('ResultType', tbl => {
    tbl.dropColumn('excluded')
  })
}
