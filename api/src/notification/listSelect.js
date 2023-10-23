const { knex } = require('../db')

async function listNotificationCategoryType() {
  const data = await knex('NotificationTypeCategory as n').select('n.id', 'n.name')
  return { ok: true, data }
}

async function listNotificationType(request) {
  const {
    params: { typeCategoryId },
  } = request
  const data = await knex('NotificationType as n')
    .where('notificationTypeCategoryId', typeCategoryId)
    .select('n.id', 'n.name')
  return { ok: true, data }
}

module.exports = {
  listNotificationCategoryType,
  listNotificationType,
}
