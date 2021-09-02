const { issueEscalated } = require('../issue/actions')
const { createNotifications } = require('./service')

function issueBased(actionParametersList) {
  return async (action, { messageContext: context }) => {
    context.bindActionCreators({ issueEscalated })
    return context.transact(async () =>
      // Trigger escalation logic for level 1 as soon as issue is created,
      // higher levels handled in escalateIssues in escalations.js
      // escalation should be idempotent (as should response to other actions)
      // so it's OK if this is "at least once"
      // This also allows one message listener between created and escalated
      // if logic is shared and avoids potential race condition.
      context.issueEscalated(action.issueId, 1)
    )
  }
}

function resultBased(actionParametersList) {
  return async (action, { messageContext: context }) => {
    return context.transact(async knex =>
      createNotifications(knex, { resultId: action.resultId }, context)
    )
  }
}

module.exports = {
  issueBased,
  resultBased,
}
