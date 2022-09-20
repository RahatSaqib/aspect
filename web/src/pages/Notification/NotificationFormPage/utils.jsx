import { getInitialValuesFromFormConfig, mergeFormConfigWithData } from '../../../components/Form/Formik/Helpers'
import getFormConfig from './Forms/editConfig'
import messages from './messages'

export const getFormConfigWithData = (intl, jobFunctions, partner, validationSchema, isEdit, values) => {
  const formSchema = getFormConfig(intl.formatMessage, jobFunctions, partner, isEdit)
  const initialValues = getInitialValuesFromFormConfig(formSchema, values)

  const formWithData = {
    ...mergeFormConfigWithData(initialValues, formSchema, messages),
    validationSchema,
    values: initialValues,
  }
  return formWithData
}

export default getFormConfigWithData
