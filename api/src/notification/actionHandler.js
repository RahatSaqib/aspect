const Promise = require('bluebird')
const { createNotifications } = require('./service')
const { issueEscalated } = require('../issue/actions')

// eslint-disable-next-line no-unused-vars
function issueBased(methodsToExecute) {
  return async (action, { messageContext: context }) => {
    // eslint-disable-next-line no-unused-vars
    return context.transact(async knex => {
      const { issueId } = action
      /// IMPORTANT NOTE: THE ISSUE ESCALATED METHOD WAS MAINTENED ONLY FOR BACKWARD COMPATIBILITY. WE NEED TO REFACTOR THIS TO HAVE THE SAME LOGIC AS RESULT BASED NOTIFICATION.

      // Trigger escalation logic for level 1 as soon as issue is created,
      // higher levels handled in escalateIssues in escalations.js
      // escalation should be idempotent (as should response to other actions)
      // so it's OK if this is "at least once"
      // This also allows one message listener between created and escalated
      // if logic is shared and avoids potential race condition.
      context.bindActionCreators({ issueEscalated })
      context.issueEscalated(issueId, 1)

      // TODO: The next lines are going to be usefull once the issuebased notifications will be well implemented.
      // await Promise.each(
      //   methodsToExecute,
      //   async ({ filterCondition, notificationTypeCategoryId }) =>
      //     createNotifications(
      //       knex,
      //       {
      //         issueId: action.issueId,
      //         filterCondition,
      //         notificationTypeCategoryId,
      //       },
      //       context
      //     )
      // )
    })
  }
}

function resultBased(methodsToExecute) {
  return async (action, { messageContext: context }) =>
    context.run(async knex => {
      await Promise.each(
        methodsToExecute,
        async ({
          filterCondition,
          notificationTypeCategoryId,
          notificationTypeId,
        }) => {
          return createNotifications(
            knex,
            {
              resultId: action.resultId,
              filterCondition,
              notificationTypeCategoryId,
              notificationTypeId,
            },
            context
          )
        }
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
