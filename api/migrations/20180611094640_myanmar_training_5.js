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
}

async function down(knex) {
  await knex.schema.dropTableIfExists('IssueResolutionTrigger')
}
