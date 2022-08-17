const Promise = require('bluebird')
const _ = require('lodash')
const { createNotifications } = require('./service')
const NotificationCache = require('./notificationCache')
// eslint-disable-next-line no-unused-vars
function issueBased() {
  return async (action, { messageContext: context }) => analyzeNotifications(context, action)
}

async function analyzeNotifications(context, action) {
  return context.run(async knex => {
    const { issueId, issueTypeId } = action

    const notificationCache = NotificationCache.getInstance(knex)
    const conditionsToEvaluate = !_.isNil(issueId)
      ? await notificationCache.getCacheValueIssueNotification()
      : await notificationCache.getCacheValueResultNotification()
    console.log(
      '🚀 ~ file: actionHandler.js ~ line 14 ~ analyzeNotifications ~ conditionsToEvaluate',
      issueId,
      issueTypeId,
      _.filter(conditionsToEvaluate, condition => (issueTypeId ? condition.issueTypeId === issueTypeId : true))
    )

    await Promise.each(
      _.filter(conditionsToEvaluate, condition => (issueTypeId ? condition.issueTypeId === issueTypeId : true)),
      async ({ filterCondition, notificationTypeCategoryId, notificationTypeId }) =>
        createNotifications(
          knex,
          {
            resultId: action.resultId,
            issueId: action.issueId,
            filterCondition: JSON.parse(filterCondition),
            notificationTypeCategoryId,
            notificationTypeId,
          },
          context
        )
    )
  })
}

function resultBased() {
  return async (action, { messageContext: context }) => analyzeNotifications(context, action)
}

async function onIssueEscalated({ issueId }, { messageContext: context }) {
  return context.transact(async knex =>
    createNotifications(
      knex,
      {
        issueId,
      },
      context
    )
  )
}
module.exports = {
  issueBased,
  resultBased,
  onIssueEscalated,
}
