module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('FactDeviceExternalSource', factDeviceExternalSource => {
    factDeviceExternalSource
      .integer('deviceId')
      .unsigned()
      .references('id')
      .inTable('Device')
      .notNullable()
      .onDelete('CASCADE')
    factDeviceExternalSource.string('sourceName', 50).notNullable()
    factDeviceExternalSource.text('data')
    factDeviceExternalSource.dateTime('updatedOn').notNullable()
    factDeviceExternalSource.unique(['deviceId', 'sourceName'], 'factdeviceexternalsource_unique')
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('FactDeviceExternalSource')
}
