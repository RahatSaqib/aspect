const { addTimestamps } = require('./utils/index')

module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable(
    'IssueResolutionTrigger',
    issueResolutionTrigger => {
      issueResolutionTrigger.increments('id')
      issueResolutionTrigger
        .integer('issueTypeId')
        .unsigned()
        .references('id')
        .inTable('IssueType')
        .notNullable()
      issueResolutionTrigger
        .integer('partnerId')
        .unsigned()
        .index()
        .references('id')
        .inTable('Partner')
        .notNullable()
      issueResolutionTrigger.specificType('resolutionConditions', 'JSON')
      addTimestamps(issueResolutionTrigger)
      issueResolutionTrigger.charset('utf8')
    }
  )

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
  await knex.schema.dropTableIfExists('IssueResolutionTrigger')

  await knex.schema.dropTableIfExists('DataCategory')
}
