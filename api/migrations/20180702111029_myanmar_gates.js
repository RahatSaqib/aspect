const { addTimestamps } = require('./utils/index')

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

  await knex.schema.createTable('IssueEventTrigger', issueEventTrigger => {
    issueEventTrigger.increments('id')
    issueEventTrigger
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
      .notNullable()
    issueEventTrigger
      .integer('issueTypeId')
      .unsigned()
      .references('id')
      .inTable('IssueType')
      .notNullable()
    issueEventTrigger
      .integer('issueEventStatusId')
      .unsigned()
      .references('id')
      .inTable('IssueEventStatus')
      .notNullable()
    issueEventTrigger.specificType('triggerConditions', 'JSON').notNullable()
    addTimestamps(issueEventTrigger)
    issueEventTrigger.unique(
      ['partnerId', 'issueTypeId', 'issueEventStatusId'],
      'issueEventTrigger_unique'
    )
    issueEventTrigger.charset('utf8')
  })
}

async function down(knex) {
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

  await knex.schema.dropTableIfExists('IssueEventTrigger')
}
