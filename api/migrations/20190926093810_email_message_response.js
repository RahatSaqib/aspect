module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('EmailMessage', emailMessage => {
    emailMessage.text('sendResponse', 'mediumtext')
  })
}

async function down(knex) {
  await knex.schema.alterTable('EmailMessage', emailMessage => {
    emailMessage.dropColumn('sendResponse')
  })
}
