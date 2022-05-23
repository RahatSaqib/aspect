const Joi = require('@hapi/joi')
const { asyncHandler } = require('../routes')
const {
  getIssueEventTriggerSubscriptions,
  triggerIssue,
  updateIssueStatus,
} = require('./service')
const { onEscalateIssues, onIssueTriggered } = require('./escalations')
const { onResolveIssues } = require('./resolutions')

const routes = [
  {
    method: 'PUT',
    path: '/issue/status/{issueId}',
    handler: asyncHandler(updateIssueStatus),
    config: {
      description: 'Update Issue Status',
      notes: 'Update the status of an issue',
      auth: { scope: ['notification:edit', 'issue:edit'] },
      validate: {
        params: {
          issueId: Joi.number().integer().positive().description('Issue Id'),
        },
        payload: {
          issueStatusExternalId: Joi.string().allow('Acknowledged'),
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/issue/trigger',
    handler: asyncHandler(triggerIssue),
    config: {
      description: 'Trigger Issue',
      notes: 'Enqueue issue in MQ through executing corresponding action',
      auth: { scope: ['notification:edit', 'issue:edit'] },
      validate: {
        payload: {
          issueType: Joi.string()
            .required()
            .description(
              'Issue Type as of value of `externalId` from table IssueType'
            ),
          data: Joi.object()
            .allow(null)
            .description('The json object with data for corresponding action'),
        },
      },
    },
  },
]

const subscriptions = [
  getIssueEventTriggerSubscriptions,
  {
    actions: {
      ESCALATE_ISSUES: onEscalateIssues,
      ISSUE_TRIGGERED: onIssueTriggered,
      RESOLVE_ISSUES: onResolveIssues,
    },
  },
]

module.exports = { routes, subscriptions }
