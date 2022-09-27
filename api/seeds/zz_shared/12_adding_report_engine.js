const _ = require('lodash')
const notificationTypeCategory = require('../fixtures/NotificationTypeCategory.json')
module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const ntTypeToInsert = await knex('NotificationTypeCategory').select()
  const notificationsToInsert = _.differenceBy(notificationTypeCategory.data, ntTypeToInsert, 'externalId')
  if (notificationsToInsert.length > 0) await knex('NotificationTypeCategory').insert(notificationsToInsert)
}
