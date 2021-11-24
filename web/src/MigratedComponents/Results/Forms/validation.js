import * as Yup from 'yup'

import messages from './validationMessages'

const getValidationSchema = formatMessage =>
  Yup.object().shape({
    siteId: Yup.string().required(formatMessage(messages.siteRequired)),
    deviceId: Yup.string().required(formatMessage(messages.deviceRequired)),
    assayId: Yup.string().required(formatMessage(messages.assayRequired)),
    startedOn: Yup.date()
      .required(formatMessage(messages.startedOnRequired))
      .test({
        message: formatMessage(messages.timeCannotBeGreaterThanNow),
        test: v => Date.parse(v) < new Date().getTime(),
      })
      .when('endedOn', {
        is: endedOnValue => !!endedOnValue, // is not empty string nor null, i.e. is defined
        then: Yup.date().max(
          Yup.ref('endedOn'),
          formatMessage(messages.startedOnCannotBeAfterEndedOn)
        ),
      }),
    endedOn: Yup.date()
      .required(formatMessage(messages.endedOnRequired))
      .test({
        message: formatMessage(messages.timeCannotBeGreaterThanNow),
        test: v => Date.parse(v) < new Date().getTime(),
      }),
    sampleCollectedOn: Yup.date()
      .required(formatMessage(messages.collectedOnRequired))
      .test({
        message: formatMessage(messages.timeCannotBeGreaterThanNow),
        test: v => Date.parse(v) < new Date().getTime(),
      }),
    resultCategory1: Yup.mixed().required(
      formatMessage(messages.resultCategory1)
    ),
  })

export default getValidationSchema
