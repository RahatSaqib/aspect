import { getInitialValuesFromFormConfig, mergeFormConfigWithData } from '../../Form/Formik/Helpers'

import getFormConfig from '../Forms/editConfig'
import getValidationSchema from '../Forms/validation'
import messages from './messages'

export const getFormConfigWithData = (intl, isNew, values) => {
  const formSchema = getFormConfig(intl.formatMessage, isNew, values.assay)
  const validationSchema = getValidationSchema(intl.formatMessage)
  const initialValues = getInitialValuesFromFormConfig(formSchema, values)

  return {
    ...mergeFormConfigWithData(initialValues, formSchema, messages),
    validationSchema,
    values: initialValues,
  }
}

export default getFormConfigWithData
