const { addTimestamps } = require('./utils/index')

module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('FileSystemWatcher', fileSystemWatcher => {
    fileSystemWatcher.increments('id')
    fileSystemWatcher.string('pathMatchRegex').notNullable()
    fileSystemWatcher
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
    fileSystemWatcher
      .integer('deviceTypeId')
      .unsigned()
      .index()
      .references('id')
      .inTable('DeviceType')
    fileSystemWatcher.charset('utf8')
  })

  await knex.schema.createTable('ResultsFileImport', resultsFileImport => {
    resultsFileImport.increments('id')
    resultsFileImport
      .integer('fileSystemWatcherId')
      .unsigned()
      .index()
      .references('id')
      .inTable('FileSystemWatcher')
    resultsFileImport.string('filePath')
    resultsFileImport.integer('recordsInFile')
    resultsFileImport.integer('resultsSaved')
    resultsFileImport.integer('newResultsCreated')
    resultsFileImport.string('status')
    addTimestamps(resultsFileImport, { nullable: true, update: true })
    resultsFileImport.charset('utf8')
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('ResultsFileImport')
  await knex.schema.dropTableIfExists('FileSystemWatcher')
}
