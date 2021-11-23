import * as Yup from 'yup'

import messages from './validationMessages'

const getValidationSchema = formatMessage =>
  Yup.object().shape({
    siteId: Yup.string().required(formatMessage(messages.siteRequired)),
    deviceId: Yup.string().required(formatMessage(messages.deviceRequired)),
    assayId: Yup.string().required(formatMessage(messages.assayRequired)),
    startedOn: Yup.mixed()
      .required(formatMessage(messages.startedOnRequired))
      .test({
        message: formatMessage(messages.timeCannotBeGreaterThanNow),
        test: v => Date.parse(v) < new Date().getTime(),
      }),
    endedOn: Yup.mixed()
      .required(formatMessage(messages.endedOnRequired))
      .test({
        message: formatMessage(messages.timeCannotBeGreaterThanNow),
        test: v => Date.parse(v) < new Date().getTime(),
      })
      .when('startedOn', {
        is: startedOnValue => !!startedOnValue, // is not empty string nor null, i.e. is defined
        then: Yup.date().min(
          Yup.ref('startedOn'),
          formatMessage(messages.endedOnCannotBeBeforeStartedOn)
        ),
      }),
    resultCategory1: Yup.mixed().required(
      formatMessage(messages.resultCategory1)
    ),
  })

export default getValidationSchema
