module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('WebhookTemplate', webhookTemplate => {
    webhookTemplate.text('url').notNullable().alter()
  })
  await knex.schema.alterTable('WebhookMessage', webhookMessage => {
    webhookMessage.text('url').alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('WebhookTemplate', webhookTemplate => {
    webhookTemplate.string('url').notNullable().alter()
  })
  await knex.schema.alterTable('WebhookMessage', webhookMessage => {
    webhookMessage.string('url').alter()
  })
}
