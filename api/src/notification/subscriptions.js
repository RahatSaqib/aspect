const actionHandlers = require('./actionHandler')
const onResultAnalyzeTimeout = require('./resultBased/notifyTimedOutResults.js')
const { notifyMessageWithErrorToSlack } = require('./common/logic')
const startDeviceInactiveRecurringNotification = require('./deviceInactiveNotificationAnalysis/deviceInactiveNotificationAnalysis')

async function getNotificationSubscriptions(knex) {
  const actionParameters = await knex('NotificationTypeCategory as ntc')
    .distinct('ntc.externalId as notificationTypeCategoryId', 'ntc.triggerCondition')
    .then(rows => {
      return rows.reduce((acc, row) => {
        const { action, method } = JSON.parse(row.triggerCondition || '{}')
        if (action && method) {
          acc[action] = actionHandlers[method]()
        }
        return acc
      }, {})
    })

  return {
    actions: {
      ...actionParameters,
      RESULT_ANALYZE_TIMEOUT: onResultAnalyzeTimeout,
      NOTIFICATION_MESSAGE_PROCESSED: onNotificationMessageProcessed,
      DEVICE_INACTIVE_NOTIFICATION_ANALYSIS: startDeviceInactiveRecurringNotification,
    },
  }
}

async function getNotificationTriggerSubscriptions({ messageContext }) {
  return messageContext.run(getNotificationSubscriptions)
}

async function onNotificationMessageProcessed({ data }) {
  await notifyMessageWithErrorToSlack(data)
}

module.exports = {
  getNotificationTriggerSubscriptions,
}
