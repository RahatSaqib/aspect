const migrateResultBasedNotificationTypes = require('../common/20211020_migrate_result_based_notification_types')

module.exports = require('../utils').seed(
  migrateResultBasedNotificationTypes,
  __filename
)
