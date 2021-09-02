const actionHandlers = require('./actionHandler')

async function getNotificationSubscriptions(knex) {
  const actionParameters = await knex('NotificationTypeCategory as ntc')
    .distinct(
      'ntc.externalId as notificationTypeCategoryId',
      'ntc.triggerCondition'
    )
    .then(items =>
      items.reduce((memo, { triggerCondition }) => {
        const { action, method } = JSON.parse(triggerCondition)
        if (action != null) {
          memo[action] = { ...(memo[action] || {}), method }
        }
        return memo
      }, {})
    )
  const actions = {}
  Object.keys(actionParameters).forEach(actionKey => {
    const { method } = actionParameters[actionKey]
    actions[actionKey] = actionHandlers[method](actionParameters[actionKey])
  })
  return { actions }
}

async function getNotificationTriggerSubscriptions({ messageContext }) {
  return messageContext.run(getNotificationSubscriptions)
}

module.exports = {
  getNotificationTriggerSubscriptions,
}
