module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.table('Device', device => {
    device
      .integer('deviceMaintenanceStatusId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('DeviceMaintenanceStatus')
    device.dateTime('deviceMaintenanceResolveOn')
    device.specificType('deviceMaintenanceData', 'JSON')
  })
  await knex('Device')
    .whereRaw(
      '1 = (select fdf.offline from FactDeviceFlag fdf where fdf.deviceId=id)'
    )
    .update({
      deviceMaintenanceStatusId: knex('DeviceMaintenanceStatus')
        .where({ token: 'offline' })
        .first('id'),
    })
  await knex('Device')
    .whereRaw(
      '0 = (select fdf.offline from FactDeviceFlag fdf where fdf.deviceId=id)'
    )
    .orWhereRaw(
      'not exists(select fdf.deviceId from FactDeviceFlag fdf where fdf.deviceId=id)'
    )
    .update({
      deviceMaintenanceStatusId: knex('DeviceMaintenanceStatus')
        .where({ token: 'online' })
        .first('id'),
    })

  await knex.raw('SET foreign_key_checks = 1')
}

async function down(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.table('Device', device => {
    device.dropForeign('deviceMaintenanceStatusId')
    device.dropIndex('deviceMaintenanceStatusId')
    device.dropColumn('deviceMaintenanceStatusId')
    device.dropColumn('deviceMaintenanceResolveOn')
    device.dropColumn('deviceMaintenanceData')
  })

  await knex.raw('SET foreign_key_checks = 1')
}
