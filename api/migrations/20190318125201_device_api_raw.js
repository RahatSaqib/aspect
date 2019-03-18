const { addTimestamps } = require('./utils/index')

module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('DeviceApiRawStatus', deviceApiRawStatus => {
    deviceApiRawStatus.increments('id')
    deviceApiRawStatus.string('name').notNullable()
    deviceApiRawStatus.string('externalId').notNullable()
    deviceApiRawStatus.string('i18nKey')
  })

  await knex.schema.createTable('DeviceApiRaw', deviceApiRaw => {
    deviceApiRaw.bigincrements('id')
    deviceApiRaw.text('rawData', 'mediumtext')
    deviceApiRaw.string('salt', 50)
    deviceApiRaw
      .integer('deviceApiKeyId')
      .unsigned()
      .index()
      .references('id')
      .inTable('DeviceApiKey')
      .onDelete('SET NULL')
    deviceApiRaw.specificType('deviceApiKeySnapshot', 'JSON')
    deviceApiRaw
      .integer('deviceApiRawStatusId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('DeviceApiRawStatus')
    addTimestamps(deviceApiRaw)
  })

  await knex.schema.createTable('DeviceApiRawArchive', deviceApiRawArchive => {
    deviceApiRawArchive.bigInteger('id')
    deviceApiRawArchive.text('rawData', 'mediumtext')
    deviceApiRawArchive.string('salt', 50)
    deviceApiRawArchive.specificType('deviceApiKeySnapshot', 'JSON')
    deviceApiRawArchive.string('deviceApiRawStatusExternalId').notNullable()
    addTimestamps(deviceApiRawArchive)
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('DeviceApiRawArchive')
  await knex.schema.dropTableIfExists('DeviceApiRaw')
  await knex.schema.dropTableIfExists('DeviceApiRawStatus')
}
