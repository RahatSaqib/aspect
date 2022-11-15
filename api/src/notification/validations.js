const Joi = require('@hapi/joi')
const { validateSortPageParams } = require('../routes')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')

function listNotificationsBaseConfig() {
  return {
    auth: { scope: ['notification:view', 'notification:edit'] },
    validate: {
      query: {
        format: Joi.string().allow('').description('File format for exporting data'),
        notificationName: Joi.string().allow('').description('Filter for notification name'),
        ...validateAllGeographyFilterParams(),
        ...validateSortPageParams(
          'name',
          'lastTriggeredOn',
          'alertCount',
          'totalTriggers',
          'typeCategory',
          'persons',
          'jobFunctions'
        ),
      },
    },
  }
}
const NotificationSchema = Joi.object().keys({
  ok: Joi.bool().required().description('False on any non-fatal error'),
  data: Joi.object()
    .allow(null)
    .keys({
      notificationTypeName: Joi.string().required().description('Notification Type Category name'),
      notificationType: Joi.string().required().description('Notification Type external Id'),
      name: Joi.string().required().description('Name of the notification'),
      filterCondition: Joi.string().allow(null).description('The condition Filters'),
      issueType: Joi.string().allow('', null).description('The external Id of the issueType'),
      reportId: Joi.string().allow('', null).description('The external Id of the report'),
      cronRecurrency: Joi.string().optional().allow('', null),
      emailSubject: Joi.string().allow(null).description('email subject'),
      emailBody: Joi.string().allow(null).description('email body'),
      smsBody: Joi.string().allow(null).description('sms body'),
      webUrl: Joi.string().allow(null).description('Web url'),
      webBody: Joi.string().allow(null).description('Web body'),
      enabled: Joi.number().min(0).max(1).required().description('is the notification enable'),
    }),
})

const optionsForSendXXX = {
  is: true,
  then: Joi.required(),
  otherwise: Joi.optional().allow('', null),
}
const listNotificationItem = {
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
  readyForNotification: Joi.number().min(0).max(1).allow(null),
}
const resultBasedNotificationPayload = Joi.object({
  notificationType: Joi.string()
    /**
     * see all values in getOptions() in `MigratedComponents/Notifications/List/config.jsx`
     * which are basically externalId from table NotificationTypeCategory
     *
     * Add more valid values upon enabling other notification types in Create
     * dropdown on Notifications list.
     * Notice that value 'issueBased' added here for completeness and is not used in handler.
     */
    .valid('resultBased', 'issueBased', 'reportBased')
    .description('externalId of notification type')
    .required(),
  issueType: Joi.string().when('notificationType', {
    is: 'issueBased',
    then: Joi.required(),
    otherwise: Joi.optional().allow('', null),
  }),
  reportId: Joi.string()
    .when('notificationType', {
      is: 'reportBased',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    })
    .description('Report ExternalId'),
  name: Joi.string().description('Name of new notification').required(),
  hasRecurrency: Joi.when('notificationType', {
    // check first sendSms...
    is: 'reportBased',
    then: Joi.boolean().optional().allow('', null),
    otherwise: Joi.forbidden(),
  }),
  cronRecurrency: Joi.string()
    .when('notificationType', {
      // check first sendSms...
      is: 'reportBased',
      otherwise: Joi.forbidden(),
      then: Joi.required(),
    })
    .description('To schedule the delivery of the email'),
  reportFrecuency: Joi.string()
    .when('notificationType', {
      // check first sendSms...
      is: 'reportBased',
      otherwise: Joi.forbidden(),
      then: Joi.required(),
    })
    .description('The frequency of the report'),
  result: Joi.array()
    .items(
      Joi.object().keys({
        assayId: Joi.string().required().description('ExternalId of selected assay'),
        resultCategoryId: Joi.array()
          .items(
            Joi.object().keys({
              label: Joi.string().description('Name of resultCategory or resultCategoryGroup'),
              value: Joi.string().required().description('ExternalId of resultCategory or resultCategoryGroup'),
              scope: Joi.string().valid('ResultCategories', 'ResultCategoryGroups').description('Item scope'),
            })
          )
          .required()
          .description('Selected items of ResultCategories or ResultCategoryGroups'),
      })
    )
    .when('notificationType', {
      is: 'resultBased',
      then: Joi.required(),
      otherwise: Joi.optional().allow('', null),
    })
    .description('Selected items of Assay and corresponding ResultCategories or ResultCategoryGroups'),
  deviceLevelId: Joi.string()
    // see options for id:'deviceLevelId' in `web/src/MigratedComponents/Notifications/Forms/editConfig.js`
    .valid('national', 'state', 'lga', 'lab')
    .description('Device area level (National, State, Lga, Laboratory)')
    .required(),
  areaItems: Joi.array()
    .items(
      Joi.object().keys({
        label: Joi.string().optional().description('Name of geography item'),
        value: Joi.string().required().description('Id of geography item'),
      })
    )
    .when('deviceLevelId', {
      is: 'national',
      then: Joi.optional().allow('', null),
      otherwise: Joi.required(),
    })
    .description('Selected items which are subset of selected deviceLevelId'),

  sendEmail: Joi.bool()
    .when('sendSms', {
      // check first sendSms...
      is: Joi.bool().valid(false),
      then: Joi.when('sendWeb', {
        // then check sendWeb
        is: Joi.bool().valid(false),
        then: Joi.valid(true).required('At least one of the notification channels should be selected'),
        otherwise: Joi.optional().allow('', null),
      }),
      otherwise: Joi.optional().allow('', null),
    })
    .description('To send over email'),
  enabled: Joi.bool().optional().default(true).description('Disable for sending notifications'),
  sendSms: Joi.bool().description('To send over sms'),
  sendWeb: Joi.bool().description('To send over webhook'),

  emailSubject: Joi.string()
    .when('sendEmail', optionsForSendXXX)
    .description('Email subject (if sendEmail is checked)'),
  emailBody: Joi.string()
    .when('sendEmail', optionsForSendXXX)
    .description('Email multi-line body (if sendEmail is checked)'),
  smsBody: Joi.string()
    .when('sendSms', optionsForSendXXX)
    .max(144)
    .description('Sms multi-line text (if sendSms is checked)'),
  webBody: Joi.string()
    .when('sendWeb', optionsForSendXXX)
    .description('Webhook multi-line text (if sendWeb is checked)'),
  webUrl: Joi.string()
    .when('sendWeb', optionsForSendXXX)
    .pattern(/^(ftp|http|https):\/\/[^ "]+$/, 'Invalid webhook url')
    .description('Webhook url'),
  persons: Joi.array()
    .items(
      Joi.object().keys({
        personId: Joi.string().required().description('Id of the Person'),
        checked: Joi.bool().valid(true, null).optional().description('Checked persons'),
      })
    )
    .min(1),
  sendToPatient: Joi.bool().description("Send to the result's patient"),
  jobFunctions: Joi.array()
    .items(
      Joi.object().keys({
        jobFunctionId: Joi.string().required().description('Id of Job Function'),
        checked: Joi.bool().valid(true, null).optional().description('Checked job functions'),
        tags: Joi.array()
          .items(
            Joi.object().keys({
              label: Joi.string().description('Tag name'),
              value: Joi.number().description('Tag Id'),
            })
          )
          .optional()
          .allow(null)
          .description('Tags for selected Job Function'),
      })
    )
    .min(1)
    .description('Checked job functions'),
}).or('sendToPatient', 'jobFunctions', 'persons')

const changeNotificationStatusPayload = Joi.object({
  enabled: Joi.bool().required(),
})

const saveNotificationResponse = {
  options: {
    allowUnknown: false,
  },
  schema: Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of error'),
    notificationTypeId: Joi.number().required().description('Saved notificationTypeId'),
  }),
}

module.exports = {
  listNotificationsBaseConfig,
  optionsForSendXXX,
  resultBasedNotificationPayload,
  changeNotificationStatusPayload,
  saveNotificationResponse,
  NotificationSchema,
  listNotificationItem,
}
