import * as Yup from 'yup'
import filter from 'lodash/filter'
import messages from './messages'

const optionsForSendXXX = requiredMessage => ({
  is: true,
  then: Yup.string().required(requiredMessage),
  otherwise: Yup.string().nullable(),
})

const validationSchema = formatMessage =>
  Yup.object()
    .shape({
      notificationType: Yup.string().oneOf(['resultBased', 'issueBased']),
      name: Yup.string().required(
        formatMessage(messages.notificationNameRequired)
      ),
      result: Yup.array()
        .of(
          Yup.object().shape({
            assayId: Yup.string().required(),
            resultCategoryId: Yup.array()
              .of(
                Yup.object().shape({
                  label: Yup.string().required(),
                  value: Yup.string().required(),
                  scope: Yup.string()
                    .required()
                    .oneOf(['ResultCategories', 'ResultCategoryGroups']),
                })
              )
              .required()
              .min(1, formatMessage(messages.resultCategoryRequired)),
          })
        )
        .min(1, formatMessage(messages.assayRequired)),
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
          otherwise: Yup.array()
            .required(formatMessage(messages.geographyRequired))
            .min(1, formatMessage(messages.geographyRequired)),
        }),
      jobFunctions: Yup.array()
        .ensure()
        .required()
        .transform((value, originalValue) => {
          const result = filter(originalValue, elem => elem.checked)
          return result
        })
        .test('oneOfRequired', item => {
          if (item.length > 0) return true
          return new Yup.ValidationError(
            formatMessage(messages.jobFunctionRequired),
            null,
            'jobFunctions[0].checked'
          )
        })
        .of(
          Yup.object().shape({
            jobFunctionId: Yup.string().required(),
            checked: Yup.boolean().required(),
            tags: Yup.array().of(
              Yup.object().shape({
                label: Yup.string(),
                value: Yup.number().required(),
              })
            ),
          })
        ),
      persons: Yup.array().when('jobFunctions', {
        is: jobFunctions => jobFunctions[0]?.jobFunctionId === 'specificPerson',
        then: Yup.array().min(1).required(),
        otherwise: Yup.array().notRequired(),
      }),
      sendEmail: Yup.boolean(),
      sendSms: Yup.boolean(),
      sendWeb: Yup.boolean(),
      emailSubject: Yup.string().when(
        'sendEmail',
        optionsForSendXXX(formatMessage(messages.emailSubjectRequired))
      ),
      emailBody: Yup.string().when(
        'sendEmail',
        optionsForSendXXX(formatMessage(messages.emailBodyRequired))
      ),
      smsBody: Yup.string()
        .when(
          'sendSms',
          optionsForSendXXX(formatMessage(messages.smsBodyRequired))
        )
        .max(144),
      webBody: Yup.string().when(
        'sendWeb',
        optionsForSendXXX(formatMessage(messages.webBodyRequired))
      ),
      webUrl: Yup.string()
        .when(
          'sendWeb',
          optionsForSendXXX(formatMessage(messages.webUrlRequired))
        )
        .matches(
          /^(ftp|http|https):\/\/[^ "]+$/,
          formatMessage(messages.webUrlInvalidFormat)
        ),
    })
    .test('oneOfRequired', item => {
      if (item.sendEmail || item.sendSms || item.sendWeb) {
        return true // everything is fine
      }
      return new Yup.ValidationError(
        formatMessage(messages.notificationChannels),
        null,
        'sendEmail'
      )
    })

export default validationSchema
