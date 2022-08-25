const { seedDeviceMaintenanceType } = require('../seeds/utils')

module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  // create and seed dictionary table DeviceMaintenanceType
  await knex.schema.createTable('DeviceMaintenanceType', x => {
    x.increments('id')
    x.string('name').notNullable()
    x.string('externalId').notNullable()
    x.string('i18nKey')
  })
  await seedDeviceMaintenanceType(knex)

  await knex.schema.createTable('DeviceMaintenance', x => {
    x.increments('id')
    x.integer('deviceId').unsigned().index().notNullable().references('id').inTable('Device')
    x.integer('deviceMaintenanceTypeId')
      .unsigned()
      .index()
      .notNullable()
      .references('id')
      .inTable('DeviceMaintenanceType')
    x.string('notes', 2000)
    x.dateTime('contextDate').index().notNullable()
    x.boolean('current').index().notNullable()
    x.dateTime('createdOn').notNullable()
    x.integer('createdBy').unsigned().index().notNullable().references('id').inTable('User')
    x.dateTime('updatedOn').notNullable()
    x.integer('updatedBy').unsigned().index().notNullable().references('id').inTable('User')
  })
}

async function down(knex) {
  await knex.schema.dropTable('DeviceMaintenance')
  await knex.schema.dropTable('DeviceMaintenanceType')
}
