exports.up = async function (knex) {
  await knex.schema.alterTable('Device', function (tbl) {
    tbl.index(['hostId'])
    tbl.index(['serial'])
    tbl.index(['macAddress'])
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Device', function (tbl) {
    tbl.dropIndex(['hostId'])
    tbl.dropIndex(['serial'])
    tbl.dropIndex(['macAddress'])
  })
}
