exports.up = async function (knex) {
  await knex.schema.alterTable('WebhookMessage', function (table) {
    table.text('payload', 'mediumtext').alter()
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('WebhookMessage', function (table) {
    table.text('payload').alter()
  })
}

exports.config = { transaction: true }
