import * as Yup from 'yup'

// const optionsForSendXXX = {
//   is: true,
//   then: Joi.required(),
//   otherwise: Joi.optional().allow('', null),
// }

const resultBasedNotificationValidation = Yup.object().shape({
  notificationType: Yup.string().oneOf(['resultBased', 'issueBased']),
  //     /**
  //      * see all values in getOptions() in `MigratedComponents/Notifications/List/config.jsx`
  //      * which are basically externalId from table NotificationTypeCategory
  //      *
  //      * Add more valid values upon enabling other notification types in Create
  //      * dropdown on Notifications list.
  //      * Notice that value 'issueBased' added here for completeness and is not used in handler.
  //      */
  //     .valid('resultBased', 'issueBased')
  name: Yup.string().required('The name is required'),
  result: Yup.array()
    .of(
      Yup.object().shape({
        assayId: Yup.string().required(),
        resultCategoryId: Yup.array()
          .of(
            Yup.object().shape({
              label: Yup.string().required('Result Category required'),
              // .description('Name of resultCategory or resultCategoryGroup'),
              value: Yup.string().required(),
              scope: Yup.string()
                .required()
                .oneOf(['ResultCategories', 'ResultCategoryGroups']),
            })
          )
          .required()
          .min(1, 'You should select at least 1 result category'),
      })
    )
    .min(1, 'You should select at least one assay'),
  deviceLevelId: Yup.string()
    .required()
    .oneOf(['national', 'state', 'lga', 'lab']),
  areaItems: Yup.array()
    .of(
      Yup.object().shape({
        value: Yup.string().required(),
      })
    )
    .when('deviceLevelId', {
      is: 'national',
      then: Yup.array().min(0),
      otherwise: Yup.array().min(1).required(),
    }),
  jobFunctions: Yup.array()
    .ensure()
    .required()
    .min(1, 'Should Select at least 1 job function for this notification')
    .of(
      Yup.object().shape({
        jobFunctionId: Yup.string().required(),
        tags: Yup.array().of(
          Yup.object().shape({
            value: Yup.number().required(),
          })
        ),
      })
    ),
})

export default resultBasedNotificationValidation

//   notificationType: Joi.string()
//     /**
//      * see all values in getOptions() in `MigratedComponents/Notifications/List/config.jsx`
//      * which are basically externalId from table NotificationTypeCategory
//      *
//      * Add more valid values upon enabling other notification types in Create
//      * dropdown on Notifications list.
//      * Notice that value 'issueBased' added here for completeness and is not used in handler.
//      */
//     .valid('resultBased', 'issueBased')
//     .description('externalId of notification type')
//     .required(),
//   name: Joi.string().description('Name of new notification').required(),
//   result: Joi.array()
//     .items(
//       Joi.object().keys({
//         assayId: Joi.string()
//           .required()
//           .description('ExternalId of selected assay'),
//         resultCategoryId: Joi.array()
//           .items(
//             Joi.object().keys({
//               label: Joi.string().description(
//                 'Name of resultCategory or resultCategoryGroup'
//               ),
//               value: Joi.string()
//                 .required()
//                 .description(
//                   'ExternalId of resultCategory or resultCategoryGroup'
//                 ),
//               scope: Joi.string()
//                 .valid('ResultCategories', 'ResultCategoryGroups')
//                 .description('Item scope'),
//             })
//           )
//           .required()
//           .description(
//             'Selected items of ResultCategories or ResultCategoryGroups'
//           ),
//       })
//     )
//     .required()
//     .description(
//       'Selected items of Assay and corresponding ResultCategories or ResultCategoryGroups'
//     ),
//   deviceLevelId: Joi.string()
//     // see options for id:'deviceLevelId' in `web/src/MigratedComponents/Notifications/Forms/editConfig.js`
//     .valid('national', 'state', 'lga', 'lab')
//     .description('Device area level (National, State, Lga, Laboratory)')
//     .required(),
//   areaItems: Joi.array()
//     .items(
//       Joi.object().keys({
//         label: Joi.string().optional().description('Name of geography item'),
//         value: Joi.string().required().description('Id of geography item'),
//       })
//     )
//     .when('deviceLevelId', {
//       is: 'national',
//       then: Joi.optional().allow('', null),
//       otherwise: Joi.required(),
//     })
//     .description('Selected items which are subset of selected deviceLevelId'),
//   sendEmail: Joi.bool().description('To send over email'),
//   sendSms: Joi.bool().description('To send over sms'),
//   sendWeb: Joi.bool().description('To send over webhook'),
//   emailSubject: Joi.string()
//     .when('sendEmail', optionsForSendXXX)
//     .description('Email subject (if sendEmail is checked)'),
//   emailBody: Joi.string()
//     .when('sendEmail', optionsForSendXXX)
//     .description('Email multi-line body (if sendEmail is checked)'),
//   smsBody: Joi.string()
//     .when('sendSms', optionsForSendXXX)
//     .max(144)
//     .description('Sms multi-line text (if sendSms is checked)'),
//   webBody: Joi.string()
//     .when('sendWeb', optionsForSendXXX)
//     .description('Webhook multi-line text (if sendWeb is checked)'),
//   webUrl: Joi.string()
//     .when('sendWeb', optionsForSendXXX)
//     .pattern(/^(ftp|http|https):\/\/[^ "]+$/, 'Invalid webhook url')
//     .description('Webhook url'),
//   jobFunctions: Joi.array()
//     .items(
//       Joi.object().keys({
//         jobFunctionId: Joi.string()
//           .required()
//           .description('Id of Job Function'),
//         checked: Joi.bool()
//           .valid(true, null)
//           .optional()
//           .description('Checked job functions'),
//         tags: Joi.array()
//           .items(
//             Joi.object().keys({
//               label: Joi.string().description('Tag name'),
//               value: Joi.number().description('Tag Id'),
//             })
//           )
//           .optional()
//           .allow(null)
//           .description('Tags for selected Job Function'),
//       })
//     )
//     .required()
//     .min(1)
//     .description('Checked job functions'),
// }
