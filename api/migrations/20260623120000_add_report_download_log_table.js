module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('ReportDownloadLog', table => {
    table.increments('id').primary()
    table.string('userName').nullable().index()
    table.string('reportExternalId', 100).nullable().index()
    table.string('format', 10).notNullable()
    table.specificType('query', 'JSON').notNullable()
    table.string('source', 30).notNullable()
    table.integer('success').unsigned().nullable().index()
    table.integer('generationTimeMs').unsigned().nullable()
    table.integer('totalTimeMs').unsigned().nullable()
    table.integer('fileSizeBytes').unsigned().nullable()
    table.integer('timeSpanDays').unsigned().nullable()
    table.string('errorMessage', 2048).nullable()
    table.integer('asyncReportId').unsigned().nullable().index().references('id').inTable('AsyncReport')
    table.dateTime('createdOn').notNullable().index()
    table.dateTime('endedOn').nullable()
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('ReportDownloadLog')
}
