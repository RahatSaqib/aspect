const actionHandlers = require('./actionHandler')

async function getNotificationSubscriptions(knex) {
  const actionParameters = await knex('NotificationTypeCategory as ntc')
    .join('NotificationType as nt', 'nt.notificationTypeCategoryId', 'ntc.id')
    .distinct(
      'ntc.externalId as notificationTypeCategoryId',
      'ntc.triggerCondition',
      'nt.filterCondition',
      'nt.id as notificationTypeId',
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
            notificationTypeId,
          }
        ) => {
          const { action, method } = JSON.parse(triggerCondition || '{}')
          if (action) {
            const elemToAdd = {
              method,
              action,
              notificationTypeCategoryId,
              filterCondition: JSON.parse(filterCondition),
              memoKey,
              notificationTypeId,
            }
            if (memo[action]) memo[action].push(elemToAdd)
            else memo[action] = [elemToAdd]
          }
          return memo
        },
        {}
      )
    )
  const actions = {}
  Object.keys(actionParameters).forEach(actionKey => {
    const [{ method }] = actionParameters[actionKey]
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
