module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('FactResultsDevice', factResultsDevice => {
    factResultsDevice.integer('resultsDeliveredCount').unsigned()
  })
}

async function down(knex) {
  await knex.schema.alterTable('FactResultsDevice', factResultsDevice => {
    factResultsDevice.dropColumns('resultsDeliveredCount')
  })
}
