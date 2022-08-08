const NotificationCache = require('../notification/notificationCache')

const subscriptions = [
  {
    actions: {
      NOTIFICATION_TYPE_CREATED: onNotificationTypeCreated,
    },
  },
]

async function onNotificationTypeCreated(notificationTypeId, { messageContext }) {
  return messageContext.run(async knex => {
    const notificationCache = NotificationCache.getInstance(knex)
    await notificationCache.refreshCache()
  })
}

module.exports = { subscriptions }
