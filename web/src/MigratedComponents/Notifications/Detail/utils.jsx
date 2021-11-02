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
  validationSchema,
  isEdit,
  values
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

  const mergedValues = { ...initialValues, ...values }
  if (isEdit) {
    mergedValues.jobFunctions = initialValues.jobFunctions.map(item => {
      const foundJF = values.jobFunctions.filter(
        jf => jf.jobFunctionId === item.jobFunctionId
      )
      return foundJF && foundJF.length ? foundJF[0] : item
    })
  }

  return {
    ...mergeFormConfigWithData(mergedValues, formSchema, messages),
    validationSchema,
    values: mergedValues,
  }
}

export default getFormConfigWithData
