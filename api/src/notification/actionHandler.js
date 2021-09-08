const Promise = require('bluebird')
const { createNotifications } = require('./service')

function issueBased(methodsToExecute) {
  return async (action, { messageContext: context }) => {
    return context.transact(async knex => {
      console.log('entre')
      // Trigger escalation logic for level 1 as soon as issue is created,
      // higher levels handled in escalateIssues in escalations.js
      // escalation should be idempotent (as should response to other actions)
      // so it's OK if this is "at least once"
      // This also allows one message listener between created and escalated
      // if logic is shared and avoids potential race condition.
      await Promise.each(
        methodsToExecute,
        async ({ filterCondition, notificationTypeCategoryId }) =>
          createNotifications(
            knex,
            {
              issueId: action.issueId,
              filterCondition,
              notificationTypeCategoryId,
            },
            context
          )
      )
    })
  }
}

function resultBased(methodsToExecute) {
  return async (action, { messageContext: context }) =>
    context.run(async knex => {
      await Promise.each(
        methodsToExecute,
        async ({ filterCondition, notificationTypeCategoryId }) =>
          createNotifications(
            knex,
            {
              resultId: action.resultId,
              filterCondition,
              notificationTypeCategoryId,
            },
            context
          )
      )
    })
}

module.exports = {
  issueBased,
  resultBased,
}
