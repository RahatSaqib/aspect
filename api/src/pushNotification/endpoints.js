const { onPushNotificationMessageCreated, onPushNotificationMessageReadyForSending } = require('./service')

const subscriptions = [
  {
    actions: {
      PUSH_NOTIFICATION_MESSAGE_CREATED: onPushNotificationMessageCreated,
      PUSH_NOTIFICATION_MESSAGE_READY_FOR_SENDING: onPushNotificationMessageReadyForSending,
    },
  },
]

module.exports = { subscriptions }
