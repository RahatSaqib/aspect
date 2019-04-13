module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('WebhookMessage', webhookMessage => {
    webhookMessage.text('response')
  })
}

async function down(knex) {
  await knex.schema.alterTable('WebhookMessage', webhookMessage => {
    webhookMessage.dropColumn('response')
  })
}
