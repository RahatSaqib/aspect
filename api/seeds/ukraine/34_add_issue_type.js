module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')
const addIssue = require('../common/add_issue')
const { upsertMessageAndNotificationTypes } = require('../common/upsert_message_and_notification_types')
const {
  adminUserName,
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')

async function seed(knex) {
  await Promise.each(['ModuleDisabled', 'DeviceOffline', 'InventoryStockExpiring'], externalId =>
    addIssue(knex, externalId, ['admin'], partnerExternalId, adminUserName)
  )
  const { adminId, partnerId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': adminUserName })
    .first('u.id as adminId', 'p.lastPartnerId as partnerId')

  await upsertMessageAndNotificationTypes(knex, partnerId, adminId)
}
