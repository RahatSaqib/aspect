module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('SmsTemplate', smsTemplate => {
    smsTemplate
      .string('phoneNumber')
      .notNullable()
      .defaultTo('{{ person.cell }}')
  })

  await knex.schema.table('SmsMessage', smsMessage => {
    smsMessage.string('phoneNumber')
  })

  await knex('SmsMessage').update({
    phoneNumber: knex('Person as p')
      .whereRaw('p.id = personId')
      .select('cell'),
  })
}

async function down(knex) {
  await knex.schema.table('SmsTemplate', smsTemplate => {
    smsTemplate.dropColumn('phoneNumber')
  })

  await knex.schema.table('SmsMessage', smsMessage => {
    smsMessage.dropColumn('phoneNumber')
  })
}
