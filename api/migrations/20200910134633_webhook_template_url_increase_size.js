module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('WebhookTemplate', webhookTemplate => {
    webhookTemplate.text('url').notNullable().alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('WebhookTemplate', webhookTemplate => {
    webhookTemplate.string('url').notNullable().alter()
  })
}
