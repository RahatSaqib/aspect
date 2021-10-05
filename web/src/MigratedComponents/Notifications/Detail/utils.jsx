import {
  getInitialValuesFromFormConfig,
  mergeFormConfigWithData,
} from '../../Form/Formik/Helpers'

import getFormConfig from '../Forms/editConfig'
import { getNotificationMeta } from '../List/config'
import messages from './messages'

export const getFormConfigWithData = (
  intl,
  jobFunctions,
  notificationType,
  notificationTypeName,
  validationSchema = null,
  isEdit
) => {
  const formSchema = getFormConfig(
    intl.formatMessage,
    notificationType,
    jobFunctions,
    isEdit
  )
  const { name } = getNotificationMeta(notificationType, intl)
  const initialValues = {
    ...getInitialValuesFromFormConfig(formSchema),
    notificationTypeName: notificationTypeName || name, // to display as read-only field
    notificationType, // to keep in formik.values as hidden field
  }
  return {
    ...mergeFormConfigWithData(initialValues, formSchema, messages),
    validationSchema,
  }
}

export default getFormConfigWithData
