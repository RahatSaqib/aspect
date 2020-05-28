module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.dropTableIfExists('Feature')
  await knex.schema.dropTableIfExists('JobFunctionFeature')
  await knex.raw('SET foreign_key_checks = 1')
}

async function down(knex) {
  await knex.schema.createTable('Feature', feature => {
    feature.increments('id')
    feature.string('module').notNullable()
    feature.charset('utf8')
  })

  await knex.schema.createTable('JobFunctionFeature', jobFunctionFeature => {
    jobFunctionFeature
      .integer('jobFunctionId')
      .unsigned()
      .index()
      .references('id')
      .inTable('JobFunction')
    jobFunctionFeature
      .integer('featureId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Feature')
    jobFunctionFeature.primary(['jobFunctionId', 'featureId'])
    jobFunctionFeature.charset('utf8')
  })
}
