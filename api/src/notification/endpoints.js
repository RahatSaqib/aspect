const Joi = require('@hapi/joi')
const { getNotificationTriggerSubscriptions } = require('./service')
const { asyncHandler, validateSortPageParams } = require('../routes')
const {
  listNotifications,
  onIssueEscalated,
  getNotifications,
} = require('./service')
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
          'contactsCount',
          'contacts'
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
  {
    method: 'GET',
    path: '/notification/history/{notificationTypeId}',
    handler: getNotifications,
    config: {
      description: 'Get all notification history',
      notes: 'Filtered and sorted list of Notifications',
      validate: {
        params: {
          notificationTypeId: Joi.number().integer().positive().required(),
        },
        query: {
          ...validateSortPageParams(),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False on any non-fatal error'),
          total: Joi.number()
            .required()
            .description('The total number of items aggregated by consumable'),
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object().keys({
                id: Joi.number().description('id'),
                webhookSent: Joi.number().description(
                  'The number of webhook notification sent'
                ),
                smsSent: Joi.number().description(
                  'The number of sms notification sent'
                ),
                emailSent: Joi.number().description(
                  'The number of email notification sent'
                ),
                date: Joi.date().description(
                  'The date notification was sent or received'
                ),
              })
            ),
        }),
      },
    },
  },
]

const subscriptions = [
  getNotificationTriggerSubscriptions,
  {
    actions: {
      ISSUE_ESCALATED: onIssueEscalated,
    },
  },
]

module.exports = { routes, subscriptions }
