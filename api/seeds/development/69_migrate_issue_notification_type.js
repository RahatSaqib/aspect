module.exports = require('../utils').seed(seed, __filename)

const migrateOldFashionNotificationType = require('../common/migrate_notification_type_shape')

async function seed(knex) {
  await migrateOldFashionNotificationType(knex)
}
