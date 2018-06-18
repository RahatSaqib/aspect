module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.dropTableIfExists('DeviceMaintenanceStatusLog')
  await knex.schema.dropTableIfExists('DeviceMaintenanceStatus')

  await knex.schema.table('FactDeviceFlag', flag => {
    flag
      .boolean('maintenance')
      .notNullable()
      .defaultTo(0)
    flag.dateTime('maintenanceDueOn')
  })

  await knex.schema.table('Issue', issue => {
    issue.dateTime('dueOn')
    issue.specificType('data', 'JSON')
  })
  
  await knex.schema.createTable('DataCategory', x => {
    x.increments('id')
    x.string('name').notNullable()
    // field 'fieldNames' holds either string with property name or stringified array of strings
    // with property names in patientData json
    x.string('fieldNames', 1000).notNullable()
    x
      .integer('geographyId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Geography')
    x.string('i18nKey')
    x.string('externalId').notNullable()
    // stringified arrays of strings with values
    x.string('validValues', 1000)
    x.string('invalidValues', 1000)
    x.integer('cutoffPercentage').notNullable()
    x.charset('utf8')
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

  await knex.schema.table('Issue', issue => {
    issue.dropColumns('dueOn', 'data')
  })
  
  await knex.schema.dropTableIfExists('DataCategory')
}
