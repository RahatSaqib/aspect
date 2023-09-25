module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('SmsTemplate', smsTemplate => {
    smsTemplate.string('message', 1000).notNullable().alter()
  })

  await knex.schema.alterTable('SmsMessage', smsMessage => {
    smsMessage.string('message', 2000).alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('SmsTemplate', smsTemplate => {
    smsTemplate.text('message').notNullable().alter()
  })

  await knex.schema.alterTable('SmsMessage', smsMessage => {
    smsMessage.string('message', 1000).alter()
  })
}
