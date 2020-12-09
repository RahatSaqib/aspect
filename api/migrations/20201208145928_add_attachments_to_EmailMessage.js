module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  // for keeping content of actually attached files (base64 encoded)
  await knex.schema.alterTable('EmailMessage', emailMessage => {
    emailMessage.specificType('attachments', 'JSON')
  })
  // for keeping attachments props - report name, format, etc
  await knex.schema.alterTable('EmailTemplate', emailTemplate => {
    emailTemplate.specificType('attachments', 'JSON')
  })
}

async function down(knex) {
  await knex.schema.alterTable('EmailTemplate', emailTemplate => {
    emailTemplate.dropColumns('attachments')
  })
  await knex.schema.alterTable('EmailMessage', emailMessage => {
    emailMessage.dropColumns('attachments')
  })
}
