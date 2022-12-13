exports.up = async function (knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.string('apiUrl', 255)
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.dropColumn('apiUrl')
  })
}
