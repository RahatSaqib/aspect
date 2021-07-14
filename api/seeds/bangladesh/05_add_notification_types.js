module.exports = require('../utils').seed(seed, __filename)
const {
  upsertMessageAndNotificationTypes,
} = require('../common/upsert_message_and_notification_types')
const { partnerName, adminUserName } = require('./fixtures/partnerData')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first('id')

  const { adminId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': adminUserName, 'p.lastPartnerId': partnerId })
    .first('u.id as adminId')

  await upsertMessageAndNotificationTypes(knex, partnerId, adminId)
}
