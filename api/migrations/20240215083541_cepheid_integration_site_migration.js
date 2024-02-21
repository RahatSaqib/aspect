exports.up = async function (knex) {
  await knex.raw(`UPDATE Site SET guid = UUID() WHERE guid IS NULL`)
  await knex.raw(`UPDATE Site SET institutionGuid = UUID() WHERE institutionGuid IS NULL`)
  await knex.raw(`UPDATE Site SET institutionName = name WHERE institutionName IS NULL`)

  await knex.schema.alterTable('Site', function (table) {
    table.uuid('guid').notNullable().alter()
    table.uuid('institutionGuid').notNullable().alter()
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Site', function (table) {
    table.uuid('guid').nullable().alter()
    table.uuid('institutionGuid').nullable().alter()
  })
}

exports.config = { transaction: true }
