const removeConnectivityMaintenanceStatus = require('../common/20210503_remove_connectivity_maintenance_status')

module.exports = require('../utils').seed(async knex => removeConnectivityMaintenanceStatus(knex), __filename)
