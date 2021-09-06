const _ = require('lodash')
const actionHandlers = require('./actionHandler')

async function getNotificationSubscriptions(knex) {
  const actionParameters = await knex('NotificationTypeCategory as ntc')
    .join('NotificationType as nt', 'nt.notificationTypeCategoryId', 'ntc.id')
    .distinct(
      'ntc.externalId as notificationTypeCategoryId',
      'ntc.triggerCondition',
      'nt.filterCondition',
      knex.raw(
        `IFNULL(MD5(CONCAT(ntc.externalId,nt.filterCondition)), ntc.externalId) as memoKey`
      )
    )
    .then(items =>
      items.reduce(
        (
          memo,
          {
            notificationTypeCategoryId,
            triggerCondition,
            filterCondition,
            memoKey,
          }
        ) => {
          const { action, method } = JSON.parse(triggerCondition)
          if (action != null) {
            memo[memoKey] = {
              ...(memo[memoKey] || {}),
              method,
              action,
              notificationTypeCategoryId,
              filterCondition: JSON.parse(filterCondition),
            }
          }
          return memo
        },
        {}
      )
    )
  const actions = {}
  Object.keys(actionParameters).forEach(actionKey => {
    const { method } = actionParameters[actionKey]
    actions[actionKey] = actionHandlers[method](
      _.omit(actionParameters[actionKey], ['method', 'memoKey'])
    )
  })
  return { actions }
}

async function getNotificationTriggerSubscriptions({ messageContext }) {
  return messageContext.run(getNotificationSubscriptions)
}

module.exports = {
  getNotificationTriggerSubscriptions,
}
