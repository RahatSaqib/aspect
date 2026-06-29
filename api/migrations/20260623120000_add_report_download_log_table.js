module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('ReportDownloadLog', table => {
    table.increments('id').primary()
    // No FK, never affect business case execution with logging issues.
    table.integer('userId').unsigned().nullable().index()
    table.string('reportExternalId', 100).nullable().index()
    table.string('format', 10).notNullable()
    table.specificType('query', 'JSON').notNullable()
    table.string('source', 30).notNullable()
    table.integer('success').unsigned().nullable().index()
    table.integer('dataQueryTimeSeconds').unsigned().nullable()
    table.integer('fileGenerationTimeSeconds').unsigned().nullable()
    table.integer('fileSizeBytes').unsigned().nullable()
    table.integer('timeSpanDays').unsigned().nullable()
    table.string('errorMessage', 2048).nullable()
    table.dateTime('startedOn').notNullable().index()
    table.dateTime('finishedOn').nullable()
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('ReportDownloadLog')
}
