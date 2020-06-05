const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listNotifications, onIssueEscalated } = require('./service')
const { exportNotifications } = require('./serviceReports')

function listNotificationsBaseConfig() {
  return {
    auth: { scope: ['notification:view', 'notification:edit'] },
    validate: {
      query: {
        format: Joi.string()
          .allow('')
          .description('File format for exporting data'),
        notificationName: Joi.string()
          .allow('')
          .description('Filter for notification name'),
        ...validateSortPageParams(
          'name',
          'lastTriggeredOn',
          'alertCount',
          'totalTriggers',
          'emailCount',
          'smsCount'
        ),
      },
    },
  }
}

const routes = [
  {
    method: 'GET',
    path: '/notification',
    handler: asyncHandler(listNotifications),
    config: {
      description: 'Notification List',
      notes: 'Pageable and sortable list of notifications',
      ...listNotificationsBaseConfig(),
    },
  },
  {
    method: 'GET',
    path: '/notification/export',
    handler: exportNotifications,
    config: {
      description: 'Export Notifications List into Excel or CSV',
      notes: 'Filtered and sorted list of Notifications',
      ...listNotificationsBaseConfig(),
    },
  },
]

const subscriptions = [
  {
    actions: {
      ISSUE_ESCALATED: onIssueEscalated,
    },
  },
]

module.exports = { routes, subscriptions }
