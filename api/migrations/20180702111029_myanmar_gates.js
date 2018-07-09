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

  await knex.schema.createTable('DataCategory', x => {
    x.increments('id')
    x.string('name').notNullable()
    // field 'fieldNames' holds either string with property name or stringified array of strings
    // with property names in patientData json
    x.string('fieldNames', 1000).notNullable()
    x
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
      .notNullable()
    x.string('i18nKey')
    x.string('externalId').notNullable()
    // stringified arrays of strings with values
    x.string('validValues', 1000)
    x.string('invalidValues', 1000)
    x.integer('cutoffPercentage').notNullable()
    x.charset('utf8')
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

  await knex.schema.dropTableIfExists('DataCategory')
}
