const updateMaintenanceStatuses = require('../common/20210226_update_device_maintenance_status')

module.exports = require('../utils').seed(
  async knex => updateMaintenanceStatuses(knex),
  __filename
)
