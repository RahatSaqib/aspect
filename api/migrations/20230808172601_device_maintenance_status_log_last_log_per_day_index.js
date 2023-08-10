async function up(knex) {
  await knex.schema.alterTable('DeviceMaintenanceStatusLog', function (table) {
    table.index(`deviceId`, 'devicemaintenancestatuslog_deviceid_day_createdon_id_index')
  })
}

async function down(knex) {
  await knex.schema.alterTable('DeviceMaintenanceStatusLog', tbl => {
    tbl.dropIndex('', 'devicemaintenancestatuslog_deviceid_day_createdon_id_index')
  })
}
module.exports = require('../src/db').migration(up, down)
