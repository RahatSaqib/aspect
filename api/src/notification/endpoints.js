const Joi = require('@hapi/joi')
const { getNotificationTriggerSubscriptions } = require('./subscriptions')
const { asyncHandler, validateSortPageParams, validateDateRangeParams } = require('../routes')
const listNotifications = require('./listNotifications')
const { clearCache } = require('./service')
const { exportNotifications } = require('./serviceReports')
const { onIssueEscalated } = require('./actionHandler')
const {
  listNotificationsBaseConfig,
  saveNotificationPayload,
  saveNotificationResponse,
  changeNotificationStatusPayload,
  NotificationSchema,
  listNotificationItem,
} = require('./validations')
const saveNotification = require('./saveNotification')
const changeNotificationStatus = require('./changeNotificationStatus')
const getNotification = require('./getNotification')
const { getAllHistory } = require('./history')
const deleteNotification = require('./deleteNotification')
const listPlaceholders = require('./listPlaceholders')
const { listNotificationCategoryType, listNotificationType } = require('./listSelect')
const { notificationHistoryQuery, notificationHistoryResponse } = require('./history/validations')

const routes = [
  {
    method: 'POST',
    path: '/notification/clearcache',
    handler: clearCache,
    config: {
      description: 'Clear Notification Cache',
      notes: 'Clear Notification Cache',
      auth: { scope: ['notification'] },
    },
  },
  {
    method: 'GET',
    path: '/notification',
    handler: listNotifications,
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
          data: Joi.array().allow(null).items(Joi.object().keys(listNotificationItem)),
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
    path: '/notification/log',
    handler: getAllHistory,
    config: {
      description: 'Get All notification logs',
      notes: 'Pageable and sortable log of notifications',
      auth: { scope: ['notification'] },
      validate: {
        query: {
          ...notificationHistoryQuery,
          ...validateSortPageParams(),
          ...validateDateRangeParams(),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False on any non-fatal error'),
          total: Joi.number().required().description('The total number of notifications that match the given filters'),
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object().keys({
                ...notificationHistoryResponse,
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
        schema: NotificationSchema,
      },
    },
  },
  {
    method: 'POST',
    path: '/notification',
    handler: saveNotification,
    config: {
      description: 'Create New Notification',
      notes: 'Details of a Notification',
      auth: { scope: ['notification:edit'] },
      validate: {
        payload: saveNotificationPayload,
      },
      response: saveNotificationResponse,
    },
  },
  {
    method: 'PUT',
    path: '/notification/{id}',
    handler: saveNotification,
    config: {
      description: 'Update Notification',
      notes: 'Details of a Notification',
      auth: { scope: ['notification:edit'] },
      validate: {
        payload: saveNotificationPayload,
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
    handler: changeNotificationStatus,
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
  {
    method: 'GET',
    path: '/notification/placeholders',
    handler: listPlaceholders,
    config: {
      description: 'List Placeholders',
      notes: 'Grouped list of placeholders available to be used in the notification templates',
      auth: { scope: ['notification'] },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False on any non-fatal error'),
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object().keys({
                notificationTypeWhitelist: Joi.array(),
                labelI18nKey: Joi.string(),
                label: Joi.string(),
                options: Joi.array().items(
                  Joi.object().keys({
                    id: Joi.string(),
                    nameI18nKey: Joi.string(),
                    name: Joi.string(),
                    assayWhitelist: Joi.array(),
                  })
                ),
              })
            ),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/notification/type-category/select-list',
    handler: listNotificationCategoryType,
    config: {
      description: 'List Notification Category Type',
      auth: { scope: ['notification'] },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False on any non-fatal error'),
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object().keys({
                id: Joi.number(),
                name: Joi.string(),
              })
            ),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/notification/type/select-list/{typeCategoryId?}',
    handler: listNotificationType,
    config: {
      description: 'List Notification Type',
      auth: { scope: ['notification'] },
      validate: {
        params: {
          typeCategoryId: Joi.number().allow(null).description('Notification type category id').integer().positive(),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False on any non-fatal error'),
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object().keys({
                id: Joi.number(),
                name: Joi.string(),
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
