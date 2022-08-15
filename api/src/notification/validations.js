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

const optionsForSendXXX = {
  is: true,
  then: Joi.required(),
  otherwise: Joi.optional().allow('', null),
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
    .valid('resultBased', 'issueBased')
    .description('externalId of notification type')
    .required(),
  name: Joi.string().description('Name of new notification').required(),
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
    .required()
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
}
