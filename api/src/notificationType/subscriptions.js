const { cache } = require('../notification/notificationCache')

const subscriptions = [
  {
    actions: {
      NOTIFICATION_TYPE_CREATED: onNotificationTypeCreated,
    },
  },
]

async function onNotificationTypeCreated(notificationTypeId, { messageContext }) {
  return messageContext.run(async knex => {
    const notificationCache = cache(knex)
    return notificationCache.refeshCache()
  })
}

module.exports = { subscriptions }
