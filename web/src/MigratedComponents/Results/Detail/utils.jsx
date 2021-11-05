import {
  getInitialValuesFromFormConfig,
  mergeFormConfigWithData,
} from '../../Form/Formik/Helpers'

import getFormConfig from '../Forms/editConfig'
import getValidationSchema from '../Forms/validation'
import messages from './messages'

export const getFormConfigWithData = (intl, isNew, values) => {
  const formSchema = getFormConfig(intl.formatMessage, isNew)
  const validationSchema = getValidationSchema(intl.formatMessage)
  const initialValues = getInitialValuesFromFormConfig(formSchema)

  const mergedValues = { ...initialValues, ...values }

  return {
    ...mergeFormConfigWithData(mergedValues, formSchema, messages),
    validationSchema,
    values: mergedValues,
  }
}

export default getFormConfigWithData
