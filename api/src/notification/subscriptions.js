const actionHandlers = require('./actionHandler')

async function getNotificationSubscriptions(knex) {
  const actionParameters = await knex('NotificationTypeCategory as ntc')
    .distinct('ntc.externalId as notificationTypeCategoryId', 'ntc.triggerCondition')
    .then(rows => {
      return rows.reduce((acc, row) => {
        const { action, method } = JSON.parse(row.triggerCondition || '{}')
        acc[action] = actionHandlers[method]()
        return acc
      }, {})
    })

  // const actionParameters = await knex('NotificationTypeCategory as ntc')
  //   .join('NotificationType as nt', 'nt.notificationTypeCategoryId', 'ntc.id')
  //   .distinct(
  //     'ntc.externalId as notificationTypeCategoryId',
  //     'ntc.triggerCondition',
  //     'nt.filterCondition',
  //     'nt.id as notificationTypeId',
  //     knex.raw(`IFNULL(MD5(CONCAT(ntc.externalId,nt.filterCondition)), ntc.externalId) as memoKey`)
  //   )
  //   .then(items =>
  //     items.reduce(
  //       (memo, { notificationTypeCategoryId, triggerCondition, filterCondition, memoKey, notificationTypeId }) => {
  //         const { action, method } = JSON.parse(triggerCondition || '{}')
  //         if (action) {
  //           const elemToAdd = {
  //             method,
  //             action,
  //             notificationTypeCategoryId,
  //             filterCondition: JSON.parse(filterCondition),
  //             memoKey,
  //             notificationTypeId,
  //           }
  //           if (memo[action]) memo[action].push(elemToAdd)
  //           else memo[action] = [elemToAdd]
  //         }
  //         return memo
  //       },
  //       {}
  //     )
  //   )

  console.log(actionParameters)
  return { actions: actionParameters }
}

async function getNotificationTriggerSubscriptions({ messageContext }) {
  return messageContext.run(getNotificationSubscriptions)
}

module.exports = {
  getNotificationTriggerSubscriptions,
}
