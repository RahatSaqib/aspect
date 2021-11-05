import * as Yup from 'yup'

import messages from './validationMessages'

const getValidationSchema = formatMessage =>
  Yup.object().shape({
    siteId: Yup.string().required(formatMessage(messages.siteRequired)),
    assayId: Yup.string().required(formatMessage(messages.assayRequired)),
    startedOn: Yup.string().required(formatMessage(messages.startedOnRequired)),
  })

export default getValidationSchema
