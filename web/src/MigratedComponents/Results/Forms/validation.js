import * as Yup from 'yup'

import messages from './validationMessages'

const getValidationSchema = formatMessage =>
  Yup.object().shape({
    siteId: Yup.string().required(formatMessage(messages.siteRequired)),
    deviceId: Yup.string().required(formatMessage(messages.deviceRequired)),
    assayId: Yup.string().required(formatMessage(messages.assayRequired)),
    startedOn: Yup.mixed().required(formatMessage(messages.startedOnRequired)),
    resultCategory1: Yup.mixed().required(
      formatMessage(messages.resultCategory1)
    ),
  })

export default getValidationSchema
