const Joi = require('joi')
const { asyncHandler } = require('../routes')
const {
  updateIssueStatus,
  getIssueEventTriggerSubscriptions,
} = require('./service')
const {
  onIssueCreated,
  onIssueTriggered,
  onEscalateIssues,
} = require('./escalations')
const { onResolveIssues } = require('./resolutions')

const routes = [
  {
    method: 'PUT',
    path: '/issue/status/{issueId}',
    handler: asyncHandler(updateIssueStatus),
    config: {
      description: 'Update Issue Status',
      notes: 'Update the status of an issue',
      auth: { scope: ['notification:edit'] },
      validate: {
        params: {
          issueId: Joi.number()
            .integer()
            .positive()
            .description('Issue Id'),
        },
        payload: {
          issueStatusExternalId: Joi.string().allow('Acknowledged'),
        },
      },
    },
  },
]

const subscriptions = [
  getIssueEventTriggerSubscriptions,
  {
    actions: {
      ISSUE_CREATED: onIssueCreated,
      ISSUE_TRIGGERED: onIssueTriggered,
      ESCALATE_ISSUES: onEscalateIssues(),
      RESOLVE_ISSUES: onResolveIssues(),
      RESULT_DATA_CATEGORY_IS_LOW: onIssueEventTrigger('DataCategoryLow'),
    },
  },
]

module.exports = { routes, subscriptions }
