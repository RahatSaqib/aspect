const renameMaintenanceStatuses = require('../../common/20210511_maintenance_status_renamings')

module.exports = require('../../utils').seed(async knex => renameMaintenanceStatuses(knex), __filename)
