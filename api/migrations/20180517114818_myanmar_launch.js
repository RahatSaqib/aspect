module.exports = require('../src/db').migration(up, down)

// TODO: Remove the following two ESLint ignore-settings when implementing migrations
/* eslint no-unused-vars: 0 */
/* eslint no-empty-function: 0 */
async function up(knex) {
  await knex.schema.createTable('DataCategory', x => {
    x.increments('id')
    x.string('name').notNullable()
    // field 'fieldNames' holds either string with property name or stringified array of strings
    // with property names in patientData json
    x.string('fieldNames', 1000).notNullable()
    x
      .integer('geographyId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Geography')
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
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.dropTableIfExists('DataCategory')

  await knex.raw('SET foreign_key_checks = 1')
}
