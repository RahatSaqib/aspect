const { partnerName } = require('./fixtures/partnerVariables')
const migrateResultBasedNotificationTypes = require('../common/20211020_migrate_result_based_notification_types')

module.exports = require('../utils').seed(
  async knex => migrateResultBasedNotificationTypes(knex, partnerName),
  __filename
)
