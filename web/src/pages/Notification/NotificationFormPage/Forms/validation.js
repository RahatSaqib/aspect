import filter from 'lodash/filter'
import * as Yup from 'yup'
import messages from './messages'

const optionsForSendXXX = requiredMessage => ({
  is: true,
  then: Yup.string().trim().required(requiredMessage),
  otherwise: Yup.string().nullable(),
})

function ensurePersonOrJobFunction(yupThis, formatMessage) {
  const {
    parent: { persons, jobFunctions, sendToPatient },
  } = yupThis

  if (sendToPatient || jobFunctions?.length > 0 || persons?.length > 0) {
    return true
  }

  return new Yup.ValidationError(formatMessage(messages.personOrJobFunctionRequired), null, 'persons')
}

const validationSchema = formatMessage =>
  Yup.object()
    .shape({
      notificationType: Yup.string().required(formatMessage(messages.notificationTypeRequired)),
      issueTypeId: Yup.string().when('notificationType', {
        is: 'issueBased',
        then: Yup.string()
          .oneOf([
            'InventoryStockout',
            'InventoryStockExpiring',
            'DeviceNoResults',
            'DeviceOffline',
            'CalibrationDueDate',
            'ModuleReplaced',
            'ModuleDisabled',
            'UnusedModules',
            'SiteWithLowFieldCompletionRate',
            'DeviceExpectedBackOnline',
          ])
          .required(),
      }),
      daysBeforeCalibrationDueDate: Yup.number().when('notificationType', {
        is: 'CalibrationDueDate',
        then: Yup.number().min(1).max(90).required(),
        otherwise: Yup.number().notRequired(),
      }),
      reportId: Yup.string().when('notificationType', {
        is: 'reportBased',
        then: Yup.string().required(),
        otherwise: Yup.string().notRequired(),
      }),
      resultBasedScope: Yup.string().when('notificationType', {
        is: 'resultBased',
        then: Yup.string().required(formatMessage(messages.required)),
        otherwise: Yup.string().notRequired(),
      }),
      name: Yup.string().trim().required(formatMessage(messages.notificationNameRequired)),
      result: Yup.array().when('notificationType', {
        is: 'resultBased',
        then: Yup.array()
          .of(
            Yup.object().shape({
              assayId: Yup.string().required(),
              resultCategoryId: Yup.array()
                .required()
                .min(1, formatMessage(messages.resultCategoryRequired))
                .of(
                  Yup.object().shape({
                    label: Yup.string().required(),
                    value: Yup.string().required(),
                    scope: Yup.string().required().oneOf(['ResultCategories', 'ResultCategoryGroups']),
                  })
                ),
            })
          )
          .min(1, formatMessage(messages.assayRequired)),
        otherwise: Yup.array().notRequired(),
      }),
      deviceLevelId: Yup.string().required().oneOf(['national', 'state', 'lga', 'lab']),
      areaItemsState: Yup.array()
        .of(Yup.object().shape({ value: Yup.string().required() }))
        .when('deviceLevelId', {
          is: 'state',
          then: Yup.array()
            .required(formatMessage(messages.geographyRequired))
            .min(1, formatMessage(messages.geographyRequired))
            .nullable(),
          otherwise: Yup.array().min(0),
        }),
      areaItemsLGA: Yup.array()
        .of(Yup.object().shape({ value: Yup.string().required() }))
        .when('deviceLevelId', {
          is: 'lga',
          then: Yup.array()
            .required(formatMessage(messages.geographyRequired))
            .min(1, formatMessage(messages.geographyRequired))
            .nullable(),
          otherwise: Yup.array().min(0),
        }),
      areaItemsLab: Yup.array()
        .of(Yup.object().shape({ value: Yup.string().required() }))
        .when('deviceLevelId', {
          is: 'lab',
          then: Yup.array()
            .required(formatMessage(messages.geographyRequired))
            .min(1, formatMessage(messages.geographyRequired))
            .nullable(),
          otherwise: Yup.array().min(0),
        }),
      sendToPatient: Yup.boolean(),
      jobFunctions: Yup.array()
        .transform((_value, originalValue) => {
          const result = filter(originalValue, elem => elem.checked)
          return result
        })
        .test(function () {
          /**
           * vanilla js function `function ()` allows access to 'this'
           * needed for this validation flow
           */
          return ensurePersonOrJobFunction(this, formatMessage)
        })
        .of(
          Yup.object().shape({
            jobFunctionId: Yup.string().required(),
            checked: Yup.boolean().required(),
            tags: Yup.array().of(Yup.object().shape({ label: Yup.string(), value: Yup.number().required() })),
          })
        ),
      persons: Yup.array().nullable(),
      sendEmail: Yup.boolean(),
      sendSms: Yup.boolean(),
      sendWeb: Yup.boolean(),
      emailSubject: Yup.string().when('sendEmail', optionsForSendXXX(formatMessage(messages.emailSubjectRequired))),
      emailBody: Yup.string()
        .when('sendEmail', optionsForSendXXX(formatMessage(messages.emailBodyRequired)))
        .when(['notificationType', 'sendEmail'], {
          is: (notificationType, sendEmail) => notificationType === 'reportBased' && sendEmail,
          then: Yup.string()
            .matches(/{{report.downloadLink}}/, formatMessage(messages.emailBodyMustContainDownloadLink))
            .required(),
        })
        .when(['notificationType', 'sendEmail'], {
          is: (notificationType, sendEmail) => notificationType === 'SiteWithLowFieldCompletionRate' && sendEmail,
          then: Yup.string()
            .matches(
              /{{site.completionRatePercentage}}/,
              formatMessage(messages.bodyMustContainCompletionRatePercentage)
            )
            .required(),
        }),
      smsBody: Yup.string()
        .when('sendSms', optionsForSendXXX(formatMessage(messages.smsBodyRequired)))
        .max(2000)
        .when(['sendSms', 'notificationType'], {
          is: (sendSms, notificationType) => {
            return sendSms && notificationType === 'SiteWithLowFieldCompletionRate'
          },
          then: Yup.string()
            .matches(
              /{{site.completionRatePercentage}}/,
              formatMessage(messages.bodyMustContainCompletionRatePercentage)
            )
            .required(),
        }),
      webBody: Yup.string()
        .when('sendWeb', optionsForSendXXX(formatMessage(messages.webBodyRequired)))
        .when(['sendWeb', 'notificationType'], {
          is: (sendWeb, notificationType) => {
            return sendWeb && notificationType === 'SiteWithLowFieldCompletionRate'
          },
          then: Yup.string()
            .matches(
              /{{site.completionRatePercentage}}/,
              formatMessage(messages.bodyMustContainCompletionRatePercentage)
            )
            .required(),
        }),
      webUrl: Yup.string()
        .when('sendWeb', optionsForSendXXX(formatMessage(messages.webUrlRequired)))
        .matches(/^(ftp|http|https):\/\/[^ "]+$/, formatMessage(messages.webUrlInvalidFormat)),

      reportDateRange: Yup.string().when('notificationType', {
        is: 'reportBased',
        then: Yup.string().required(),
        otherwise: Yup.string().notRequired(),
      }),
      reportStartingWeekDay: Yup.string().when('reportDateRange', {
        is: 'PREVIOUS_WEEK',
        then: Yup.string().required(),
        otherwise: Yup.string().notRequired(),
      }),
    })
    .test('oneOfRequired', item => {
      if (item.sendEmail || item.sendSms || item.sendWeb) {
        return true // everything is fine
      }
      return new Yup.ValidationError(formatMessage(messages.notificationChannels), null, 'sendEmail')
    })

export default validationSchema
