const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const {
  listNotifications,
  onIssueEscalated,
  getNotifications,
  saveNotification,
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

const optionsForSendXXX = {
  is: true,
  then: Joi.required(),
  otherwise: Joi.optional().allow('', null),
}

const resultBasedNotificationPayload = {
  notificationType: Joi.string()
    // see all values in getOptions() in `MigratedComponents/Notifications/List/config.jsx`
    .allow('result-based')
    .description('externalId of notification type')
    .required(),
  name: Joi.string().description('Name of new notification').required(),
  result: Joi.array()
    .items(
      Joi.object().keys({
        assayId: Joi.string().description('ExternalId of selected assay'),
        resultCategoryId: Joi.array()
          .items(
            Joi.object().keys({
              label: Joi.string().description(
                'Name of resultCatehory or resultCategoryGroup'
              ),
              value: Joi.string().description(
                'ExternalId of resultCatehory or resultCategoryGroup'
              ),
              scope: Joi.string()
                .allow('ResultCategories', 'ResultCategoryGroups')
                .description('Item scope'),
            })
          )
          .description(
            'Selected items of ResultCategories or ResultCategoryGroups'
          ),
      })
    )
    .description(
      'Selected items of Assay and corresponding ResultCategories or ResultCategoryGroups'
    ),
  deviceLevelId: Joi.string()
    .description('Device area level (National, State, Lga, Laboratory)')
    .required(),
  areaItems: Joi.array()
    .items(
      Joi.object().keys({
        label: Joi.string().optional().description('Name of geography item'),
        value: Joi.string().required().description('Id of geography item'),
      })
    )
    .description('Selected items which are subset of selected deviceLevelId'),
  sendEmail: Joi.bool().description('To send over email'),
  sendSms: Joi.bool().description('To send over sms'),
  sendWeb: Joi.bool().description('To send over webhook'),
  emailSubject: Joi.string().description(
    'Email subject (if sendEmail is checked)'
  ),
  emailBody: Joi.string()
    .when('sendEmail', optionsForSendXXX)
    .description('Email multi-line body (if sendEmail is checked)'),
  smsBody: Joi.string()
    .when('sendSms', optionsForSendXXX)
    .description('Sms multi-line text (if sendSms is checked)'),
  webBody: Joi.string()
    .when('sendWeb', optionsForSendXXX)
    .description('Webhook multi-line text (if sendWeb is checked)'),
  webUrl: Joi.string()
    .when('sendWeb', optionsForSendXXX)
    .description('Webhook url'),
  jobFunctions: Joi.array()
    .items(
      Joi.object().keys({
        jobFunctionId: Joi.string()
          .required()
          .description('Name of geography item'),
        checked: Joi.bool().required().description('Checked job functions'),
        tags: Joi.alternatives()
          .try(Joi.array(), Joi.string().allow(null, ''))
          .description('Tags for selected Job Function'),
      })
    )
    .description('Checked job functions'),
}
const saveNotificationResponse = {
  options: {
    allowUnknown: false,
  },
  schema: Joi.object().keys({
    ok: Joi.bool()
      .required()
      .description('False if there was some sort of error'),
    notificationTypeId: Joi.number()
      .required()
      .description('Saved notificationTypeId'),
  }),
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
