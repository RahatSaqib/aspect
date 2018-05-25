module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  // TODO do we need to create issues for existing logs?
  await knex.schema.dropTableIfExists('DeviceMaintenanceStatusLog')
  await knex.schema.dropTableIfExists('DeviceMaintenanceStatus')
  await knex.schema.table('FactDeviceFlag', flag => {
    flag
      .boolean('maintenance')
      .notNullable()
      .defaultTo(0)
    flag.dateTime('maintenanceDueOn')
  })
}

async function down(knex) {
  await knex.schema.createTable(
    'DeviceMaintenanceStatus',
    maintenanceStatus => {
      maintenanceStatus.increments('id')
      maintenanceStatus.string('name').notNullable()
      maintenanceStatus.string('i18nKey')
      maintenanceStatus.string('token')
    }
  )

  await knex('DeviceMaintenanceStatus').insert([
    {
      name: 'Online',
      i18nKey: 'deviceMaintenanceStatusOnline',
      token: 'online',
    },
    {
      name: 'Offline',
      i18nKey: 'deviceMaintenanceStatusOffline',
      token: 'offline',
    },
  ])

  await knex.schema.createTable(
    'DeviceMaintenanceStatusLog',
    maintenanceStatusLog => {
      maintenanceStatusLog.increments('id')
      maintenanceStatusLog
        .integer('deviceId')
        .unsigned()
        .index()
        .references('id')
        .inTable('Device')
        .onDelete('CASCADE')
      maintenanceStatusLog
        .integer('deviceMaintenanceStatusId')
        .unsigned()
        .index()
        .references('id')
        .inTable('DeviceMaintenanceStatus')
        .onDelete('SET NULL')
      maintenanceStatusLog.specificType('data', 'JSON').notNullable()
      maintenanceStatusLog.dateTime('changedOn')
      maintenanceStatusLog.dateTime('createdOn')
      maintenanceStatusLog
        .integer('createdBy')
        .unsigned()
        .index()
        .references('id')
        .inTable('User')
        .onDelete('SET NULL')
    }
  )
  await knex.schema.table('FactDeviceFlag', flag => {
    flag.dropColumns('maintenance', 'maintenanceDueOn')
  })
}
