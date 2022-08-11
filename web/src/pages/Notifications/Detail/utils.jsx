import { getInitialValuesFromFormConfig, mergeFormConfigWithData } from '../../../components/Form/Formik/Helpers'

import getFormConfig from '../Forms/editConfig'
import { getNotificationMeta } from '../List/config'
import messages from './messages'

export const getFormConfigWithData = (
  intl,
  jobFunctions,
  notificationType,
  notificationTypeName,
  validationSchema,
  isEdit,
  values
) => {
  const formSchema = getFormConfig(intl.formatMessage, notificationType, jobFunctions, isEdit)
  const { name } = getNotificationMeta(notificationType, intl)
  const initialValues = {
    ...getInitialValuesFromFormConfig(formSchema, values),
    notificationTypeName: notificationTypeName || name, // to display as read-only field
    notificationType, // to keep in formik.values as hidden field
  }
  return {
    ...mergeFormConfigWithData(initialValues, formSchema, messages),
    validationSchema,
    values: initialValues,
  }
}

export default getFormConfigWithData
