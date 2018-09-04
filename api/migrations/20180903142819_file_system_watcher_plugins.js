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
}

async function down(knex) {
  await knex.schema.dropTableIfExists('FileSystemWatcherPlugin')
}
