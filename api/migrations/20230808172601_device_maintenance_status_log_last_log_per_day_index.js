async function up(knex) {
  await knex.schema.raw(
    `ALTER TABLE DeviceMaintenanceStatusLog ADD INDEX devicemaintenancestatuslog_deviceid_day_createdon_id_index (deviceId, day, createdOn, id)`
  )
}

async function down(knex) {
  await knex.schema.alterTable('DeviceMaintenanceStatusLog', tbl => {
    tbl.dropIndex('', 'devicemaintenancestatuslog_deviceid_day_createdon_id_index')
  })
}
module.exports = require('../src/db').migration(up, down)
