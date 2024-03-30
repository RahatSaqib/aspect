exports.up = async function (knex) {
  await knex.raw(`UPDATE DeviceOperation SET guid = UUID() WHERE guid IS NULL`)

  await knex.schema.alterTable('DeviceOperation', function (table) {
    table.uuid('guid').notNullable().alter()
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('DeviceOperation', function (table) {
    table.uuid('guid').nullable().alter()
  })
}

exports.config = { transaction: true }
