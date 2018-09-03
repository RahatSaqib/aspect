module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable(
    'FileSystemWatcher',
    fileSystemWatcherPlugin => {
      fileSystemWatcherPlugin.increments('id')
      fileSystemWatcherPlugin.string('pathMatchRegex').notNullable()
      fileSystemWatcherPlugin
        .integer('partnerId')
        .unsigned()
        .index()
        .references('id')
        .inTable('Partner')
      fileSystemWatcherPlugin
        .integer('deviceTypeId')
        .unsigned()
        .index()
        .references('id')
        .inTable('DeviceType')
      fileSystemWatcherPlugin.charset('utf8')
    }
  )
}

async function down(knex) {
  await knex.schema.dropTableIfExists('FileSystemWatcherPlugin')
}
