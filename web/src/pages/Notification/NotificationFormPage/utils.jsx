import { getInitialValuesFromFormConfig, mergeFormConfigWithData } from '../../../components/Form/Formik/Helpers'
import getFormConfig from './Forms/editConfig'
import messages from './messages'

export const getFormConfigWithData = (intl, jobFunctions, notificationType, validationSchema, isEdit, values) => {
  const formSchema = getFormConfig(intl.formatMessage, jobFunctions, isEdit)
  const initialValues = {
    ...getInitialValuesFromFormConfig(formSchema, values),
    notificationType: notificationType === '' ? 'resultBased' : notificationType, // to display as read-only field
  }
  return {
    ...mergeFormConfigWithData(initialValues, formSchema, messages),
    validationSchema,
    values: initialValues,
  }
}

export default getFormConfigWithData
