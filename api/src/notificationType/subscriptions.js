const { subscriptions: notificationSubscriptions } = require('../notification/endpoints')

const subscriptions = [
  {
    actions: {
      NOTIFICATION_TYPE_CREATED: onNotificationTypeCreated,
    },
  },
]

async function onNotificationTypeCreated(notificationTypeId, { messageContext }) {
  return messageContext.run(async () => messageContext.queue.subscribe('notification', notificationSubscriptions))
}

module.exports = { subscriptions }
