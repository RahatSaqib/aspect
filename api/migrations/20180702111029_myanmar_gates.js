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

  // allow nullable issueId on IssueEvent
  await knex.schema.table('IssueEvent', issueEvent => {
    issueEvent
      .integer('issueId')
      .unsigned()
      .nullable()
      .alter()
  })
}

async function down(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.table('SmsTemplate', smsTemplate => {
    smsTemplate.dropColumn('phoneNumber')
  })

  await knex.schema.table('SmsMessage', smsMessage => {
    smsMessage.dropColumn('phoneNumber')
  })

  await knex('IssueEvent')
    .whereNull('issueId')
    .delete()
  await knex.schema.table('IssueEvent', issueEvent => {
    issueEvent
      .integer('issueId')
      .unsigned()
      .notNullable()
      .alter()
  })

  await knex.raw('SET foreign_key_checks = 1')
}
