module.exports = require('../utils').seed(seed, __filename)
const { upsertMessageAndNotificationTypes } = require('../common/upsert_message_and_notification_types')
const { adminUserName } = require('./fixtures/partnerData')

async function seed(knex) {
  const { adminId, partnerId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': adminUserName })
    .first('u.id as adminId', 'p.lastPartnerId as partnerId')

  await upsertMessageAndNotificationTypes(knex, partnerId, adminId)
}
