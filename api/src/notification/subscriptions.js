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
            const elemToAdd = {
              method,
              action,
              notificationTypeCategoryId,
              filterCondition: JSON.parse(filterCondition),
              memoKey,
            }
            if (memo[action]) memo[action].push(elemToAdd)
            else memo[action] = [elemToAdd]
          }
          return memo
        },
        []
      )
    )
  const actions = {}
  Object.keys(actionParameters).forEach(actionKey => {
    const { method } = _.sample(actionParameters[actionKey])
    actions[actionKey] = actionHandlers[method](actionParameters[actionKey])
  })
  console.log(actionParameters['RESULT_LOGGED'], JSON.stringify(actionParameters['RESULT_LOGGED']))
  return { actions }
}

async function getNotificationTriggerSubscriptions({ messageContext }) {
  return messageContext.run(getNotificationSubscriptions)
}

module.exports = {
  getNotificationTriggerSubscriptions,
}
