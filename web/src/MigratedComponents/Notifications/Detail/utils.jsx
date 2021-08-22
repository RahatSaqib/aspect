import {
  getInitialValuesFromFormConfig,
  mergeFormConfigWithData,
} from '../../Form/Formik/Helpers'

import getFormConfig from '../Forms/editConfig'
import { getNotificationMeta } from '../List/config'
import messages from './messages'

export const getFormConfigWithData = (
  intl,
  notificationType,
  notificationTypeName
) => {
  const formSchema = getFormConfig(intl.formatMessage, notificationType)
  const { name } = getNotificationMeta(notificationType, intl)
  const initialValues = {
    ...getInitialValuesFromFormConfig(formSchema),
    notificationTypeName: notificationTypeName || name, // to display as read-only field
    notificationType, // to keep in formik.values as hidden field
  }
  return mergeFormConfigWithData(initialValues, formSchema, messages)
}

export default getFormConfigWithData
