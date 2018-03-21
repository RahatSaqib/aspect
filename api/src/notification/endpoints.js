const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const {
  listNotifications,
  onIssueCreated,
  onIssueEscalated,
  onIssueResolved,
} = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/notification',
    handler: asyncHandler(listNotifications),
    config: {
      description: 'Notification List',
      notes: 'Pageable and sortable list of notifications',
      auth: { scope: ['notification:view', 'notification:edit'] },
      validate: {
        query: Object.assign(
          {
            contactNameOrEmail: Joi.string()
              .allow('')
              .description('Filter for notification name'),
          },
          validateSortPageParams(
            'alertName',
            'lastTriggeredOn',
            'recipientsCount',
            'triggersCount',
            'errorsCount'
          )
        ),
      },
    },
  },
]

const subscriptions = [
  {
    actions: {
      ISSUE_CREATED: onIssueCreated,
      ISSUE_ESCALATED: onIssueEscalated,
      ISSUE_RESOLVED: onIssueResolved,
    },
  },
]

module.exports = { routes, subscriptions }
