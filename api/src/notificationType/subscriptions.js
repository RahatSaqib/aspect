const subscriptions = [
  {
    actions: {
      NOTIFICATION_TYPE_CREATED: onNotificationTypeCreated,
    },
  },
]

async function onNotificationTypeCreated(
  notificationTypeId,
  { messageContext }
) {
  return messageContext.run(async () =>
    messageContext.queue.subscribe('notificationType', subscriptions)
  )
}

module.exports = { subscriptions }
