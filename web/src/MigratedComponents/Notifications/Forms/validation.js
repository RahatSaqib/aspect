import * as Yup from 'yup'
import messages from './messages'

const optionsForSendXXX = requiredMessage => ({
  is: true,
  then: Yup.string().required(requiredMessage),
  otherwise: Yup.string().nullable(),
})

const validationSchema = (formatMessage, { jobFunctions }) => {
  return Yup.object().shape({
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
            .required(formatMessage(messages.resultCategoryRequired))
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
    'jobFunctions[0].checked': Yup.boolean().when(
      jobFunctions.map((_, index) => `jobFunctions[${index}].checked`),
      {
        is: (...args) => {
          // if all Job Function checkboxes are unchecked
          return !args.find(checked => checked === true)
        },
        then: Yup.boolean().required(
          formatMessage(messages.jobFunctionRequired)
        ),
        otherwise: Yup.boolean(),
      }
    ),
    // jobFunctions: Yup.array()
    //   .ensure()
    //   .required()
    //   .transform((value, originalValue) => {
    //     const result = filter(originalValue, elem => elem.checked)
    //     return result
    //   })
    //   .min(1, formatMessage(messages.jobFunctionRequired))
    //   .of(
    //     Yup.object().shape({
    //       jobFunctionId: Yup.string().required(),
    //       checked: Yup.boolean().required(),
    //       tags: Yup.array().of(
    //         Yup.object().shape({
    //           label: Yup.string(),
    //           value: Yup.number().required(),
    //         })
    //       ),
    //     })
    //   ),
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
}

export default validationSchema
