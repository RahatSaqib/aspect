const Joi = require('@hapi/joi')
const { getNotificationTriggerSubscriptions } = require('./subscriptions')
const { asyncHandler, validateSortPageParams } = require('../routes')
const {
  listNotifications,
  getNotifications,
  getNotification,
  saveNotification,
  deleteNotification,
  saveStatusNotification,
} = require('./service')
const { exportNotifications } = require('./serviceReports')
const { onIssueEscalated } = require('./actionHandler')
const {
  listNotificationsBaseConfig,
  resultBasedNotificationPayload,
  saveNotificationResponse,
  changeNotificationStatusPayload,
} = require('./validations')

const routes = [
  {
    method: 'GET',
    path: '/notification',
    handler: asyncHandler(listNotifications),
    config: {
      description: 'Notification List',
      notes: 'Pageable and sortable list of notifications',
      auth: { scope: ['notification'] },
      ...listNotificationsBaseConfig(),
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False on any non-fatal error'),
          total: Joi.number().required().description('The total number of notifications that match the given filters'),
          length: Joi.number().required().description('The number of notifications included in this response'),
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object().keys({
                id: Joi.number(),
                name: Joi.string(),
                totalTriggers: Joi.number(),
                alertCount: Joi.number().allow(null),
                jobFunctionsCount: Joi.number(),
                jobFunctions: Joi.string().allow(null),
                persons: Joi.string().allow(null),
                sendToPatient: Joi.boolean().allow(null),
                personsCount: Joi.number(),
                typeCategory: Joi.string(),
                lastTriggeredOn: Joi.date().iso().allow(null),
                enabled: Joi.number().min(0).max(1).required().description('is the notification enable'),
              })
            ),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/notification/export',
    handler: exportNotifications,
    config: {
      description: 'Export Notifications List into Excel or CSV',
      auth: { scope: ['notification'] },
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
      auth: { scope: ['notification'] },
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
          total: Joi.number().required().description('The total number of items aggregated by consumable'),
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object().keys({
                id: Joi.number().description('id'),
                webhookSent: Joi.number().description('The number of webhook notification sent'),
                webhookWithErrors: Joi.number().description('The number of webhook notification sent but with errors'),
                webhookPending: Joi.number().description('The number of webhook notification pending to be sent'),
                smsSent: Joi.number().description('The number of sms notification sent'),
                smsWithErrors: Joi.number().description('The number of sms notification sent'),
                smsPending: Joi.number().description('The number of sms notification sent'),
                emailSent: Joi.number().description('The number of email notification sent'),
                emailWithErrors: Joi.number().description('The number of email notification sent with errors'),
                emailPending: Joi.number().description('The number of email notification pending to be send'),
                date: Joi.date().description('The date notification was sent or received'),
                issueId: Joi.number().allow(null).description(`Notification's issueId`),
                resultId: Joi.number().allow(null).description(`Notification's resultId`),

                sampleId: Joi.alternatives().allow(null, '').try(Joi.number(), Joi.string()).description('Sample id'),
                patientId: Joi.string().allow(null, '').description('The patient Id'),

                emailRecipients: Joi.array()
                  .allow(null)
                  .description('Comma-separated person names who get notification email'),
                smsRecipients: Joi.array()
                  .allow(null)
                  .description('Comma-separated person names who get notification sms'),
                webhookRecipients: Joi.array()
                  .allow(null)
                  .description('Comma-separated url who get notification the webhook'),
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
      auth: { scope: ['notification'] },
      validate: {
        params: {
          id: Joi.number().integer().positive().required(),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False on any non-fatal error'),
          data: Joi.object()
            .allow(null)
            .keys({
              notificationTypeName: Joi.string().required().description('Notification Type Category name'),
              notificationType: Joi.string().required().description('Notification Type external Id'),
              name: Joi.string().required().description('Name of the notification'),
              filterCondition: Joi.string().allow(null).description('The condition Filters'),
              emailSubject: Joi.string().allow(null).description('email subject'),
              emailBody: Joi.string().allow(null).description('email body'),
              smsBody: Joi.string().allow(null).description('sms body'),
              webUrl: Joi.string().allow(null).description('Web url'),
              webBody: Joi.string().allow(null).description('Web body'),
              enabled: Joi.number().min(0).max(1).required().description('is the notification enable'),
            }),
        }),
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
          id: Joi.string().description('Item id depending on payload.notificationType').required(),
        },
      },
      response: saveNotificationResponse,
    },
  },
  {
    method: 'DELETE',
    path: '/notification/{notificationId}',
    handler: asyncHandler(deleteNotification),
    config: {
      description: "Deletes a notification type, only if it wasn't triggered",
      notes: 'Returns ok: true when successfully deleted',
      auth: { scope: ['notification:edit'] },
      validate: {
        params: {
          notificationId: Joi.number().integer().positive().required(),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/notification/{id}/change-status',
    handler: asyncHandler(saveStatusNotification),
    config: {
      description: 'Update Notification status',
      notes: 'Returns ok: true when notification was updated successfully',
      auth: { scope: ['notification:edit'] },
      validate: {
        payload: changeNotificationStatusPayload,
        params: {
          id: Joi.string().description('Item id depending on payload.notificationType').required(),
        },
      },
      response: saveNotificationResponse,
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
