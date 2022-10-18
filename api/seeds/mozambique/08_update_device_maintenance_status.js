const updateMaintenanceStatuses = require('../common/upsert_device_maintenance_status')

module.exports = require('../utils').seed(async knex => updateMaintenanceStatuses(knex), __filename)
