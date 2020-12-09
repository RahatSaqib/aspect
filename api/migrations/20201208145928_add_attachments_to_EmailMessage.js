module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('EmailMessage', emailMessage => {
    emailMessage.specificType('attachments', 'JSON')
  })
}

async function down(knex) {
  await knex.schema.alterTable('EmailMessage', emailMessage => {
    emailMessage.dropColumns('attachments')
  })
}
