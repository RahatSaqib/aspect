const Promise = require('bluebird')
const { createNotifications } = require('./service')
const { issueEscalated } = require('../issue/actions')
const { cache } = require('./notificationCache')
// eslint-disable-next-line no-unused-vars
function issueBased() {
  return async (action, { messageContext: context }) => {
    // eslint-disable-next-line no-unused-vars
    return context.transact(async knex => {
      const { issueId } = action
      /// IMPORTANT NOTE: THE ISSUE ESCALATED METHOD WAS MAINTENED ONLY FOR BACKWARD COMPATIBILITY. WE NEED TO REFACTOR THIS
      /// TO HAVE THE SAME LOGIC AS RESULT BASED NOTIFICATION.

      // Trigger escalation logic for level 1 as soon as issue is created,
      // higher levels handled in escalateIssues in escalations.js
      // escalation should be idempotent (as should response to other actions)
      // so it's OK if this is "at least once"
      // This also allows one message listener between created and escalated
      // if logic is shared and avoids potential race condition.
      context.bindActionCreators({ issueEscalated })
      context.issueEscalated(issueId, 1)
    })
  }
}

function resultBased() {
  return async (action, { messageContext: context }) =>
    context.run(async knex => {
      const notificationCache = cache(knex)
      await Promise.each(
        await notificationCache.getCacheValue(),
        async ({ filterCondition, notificationTypeCategoryId, notificationTypeId }) =>
          createNotifications(
            knex,
            {
              resultId: action.resultId,
              filterCondition: JSON.parse(filterCondition),
              notificationTypeCategoryId,
              notificationTypeId,
            },
            context
          )
      )
    })
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
