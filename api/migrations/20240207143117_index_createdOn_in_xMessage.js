exports.up = async function (knex) {
  await knex.schema.alterTable('EmailMessage', function (tbl) {
    tbl.index(['createdOn'])
  })
  await knex.schema.alterTable('SmsMessage', function (tbl) {
    tbl.index(['createdOn'])
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('EmailMessage', function (tbl) {
    tbl.dropIndex('createdOn')
  })
  await knex.schema.alterTable('SmsMessage', function (tbl) {
    tbl.dropIndex('createdOn')
  })
}
