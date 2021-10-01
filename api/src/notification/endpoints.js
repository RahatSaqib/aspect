const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const {
  listNotifications,
  onIssueEscalated,
  getNotifications,
  getNotification,
  saveNotification,
} = require('./service')
const { exportNotifications } = require('./serviceReports')
const {
  listNotificationsBaseConfig,
  resultBasedNotificationPayload,
  saveNotificationResponse,
} = require('./validations')

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
  {
    method: 'GET',
    path: '/notification/{id}',
    handler: getNotification,
    config: {
      description: 'Get Notification',
      notes: 'Details of a Notification',
      validate: {
        params: {
          id: Joi.number().integer().positive().required(),
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/notification',
    handler: asyncHandler(saveNotification),
    config: {
      description: 'Create New Notification',
      notes: 'Details of a Notification',
      auth: { scope: ['notification:edit'] },
      validate: {
        payload: resultBasedNotificationPayload,
      },
      response: saveNotificationResponse,
    },
  },
  {
    method: 'PUT',
    path: '/notification/{id}',
    handler: asyncHandler(saveNotification),
    config: {
      description: 'Update Notification',
      notes: 'Details of a Notification',
      auth: { scope: ['notification:edit'] },
      validate: {
        payload: resultBasedNotificationPayload,
        params: {
          id: Joi.string()
            .description('Item id depending on payload.notificationType')
            .required(),
        },
      },
      response: saveNotificationResponse,
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
