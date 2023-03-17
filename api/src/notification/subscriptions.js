const actionHandlers = require('./actionHandler')
const onResultAnalyzeTimeout = require('./resultBased/notifyTimedOutResults')

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

  return { actions: actionParameters }
}

async function getNotificationTriggerSubscriptions({ messageContext }) {
  return messageContext.run(getNotificationSubscriptions)
}

module.exports = {
  getNotificationTriggerSubscriptions,
  RESULT_ANALYZE_TIMEOUT: onResultAnalyzeTimeout,
}
