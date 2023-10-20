exports.up = async function (knex) {
  await knex.schema.alterTable('Result', tbl => {
    tbl.index(['moduleSerial'])
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Result', tbl => {
    tbl.dropIndex('moduleSerial')
  })
}
