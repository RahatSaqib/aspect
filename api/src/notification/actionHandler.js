const Promise = require('bluebird')
const { createNotifications } = require('./service')

const NotificationCache = require('./notificationCache')
// eslint-disable-next-line no-unused-vars
function issueBased() {
  return async (action, { messageContext: context }) => analyzeNotifications(context, action, true)
}

async function analyzeNotifications(context, action, issue = false) {
  return context.run(async knex => {
    const notificationCache = NotificationCache.getInstance(knex)
    const conditionsToEvaluate = issue
      ? await notificationCache.getCacheValueIssueNotification()
      : await notificationCache.getCacheValueResultNotification()
    await Promise.each(
      conditionsToEvaluate,
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
