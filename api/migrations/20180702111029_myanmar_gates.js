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
    issueEventTrigger
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
      .notNullable()
    addTimestamps(issueEventTrigger)
    issueEventTrigger.charset('utf8')
  })
  // Insert triggers for every issue type that has a notification type configured
  const now = new Date()
  const issueEventTriggers = await knex('NotificationType as nt')
    .crossJoin('IssueEventStatus as iet')
    .orderBy('nt.partnerId', 'nt.issueTypeId', 'iet.id')
    .distinct('nt.partnerId', 'nt.issueTypeId', 'iet.id as issueEventStatusId')
    .map(row => {
      row.createdOn = now
      row.updatedOn = now
      return row
    })
  await knex('IssueEventTrigger').insert(issueEventTriggers)
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
