import union from 'lodash/union'
import { getInitialValuesFromFormConfig, mergeFormConfigWithData } from '../../../components/Form/Formik/Helpers'

import getFormConfig from './Forms/editConfig'
import messages from './messages'

import notificationListMessages from '../NotificationListPage/messages'

export const getFormConfigWithData = (
  intl,
  jobFunctions,
  notificationType,
  notificationTypeName,
  validationSchema,
  isEdit,
  values
) => {
  const formSchema = getFormConfig(intl.formatMessage, jobFunctions, isEdit)
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

const groupedOptions = ({ formatMessage }) => [
  {
    label: formatMessage(notificationListMessages.notificationCreateGroupForResults),
    options: [
      {
        id: 'resultBased', // externalId from table NotificationTypeCategory
        name: formatMessage(notificationListMessages.notificationTypeResultBased),
        icon: 'AiOutlineSolution',
      },
      {
        id: 'test-updated',
        name: formatMessage(notificationListMessages.notificationTypeTestUpdated),
        icon: 'AiOutlineShake',
        isDisabled: true,
      },
    ],
  },
  {
    label: formatMessage(notificationListMessages.notificationCreateGroupForDevices),
    options: [
      {
        id: 'offline',
        name: formatMessage(notificationListMessages.notificationTypeOffline),
        icon: 'AiOutlineApi',
        isDisabled: true,
      },
      {
        id: 'report',
        name: formatMessage(notificationListMessages.notificationTypeReport),
        icon: 'AiOutlineBarChart',
        isDisabled: true,
      },
      {
        id: 'low-inventory',
        name: formatMessage(notificationListMessages.notificationTypeLowInventory),
        icon: 'AiOutlineDashboard',
        isDisabled: true,
      },
      {
        id: 'calibration',
        name: formatMessage(notificationListMessages.notificationTypeCalibration),
        icon: 'AiOutlineTool',
        isDisabled: true,
      },
      {
        id: 'module',
        name: formatMessage(notificationListMessages.notificationTypeModule),
        icon: 'AiOutlineBlock',
        isDisabled: true,
      },
      {
        id: 'critical-error',
        name: formatMessage(notificationListMessages.notificationTypeCriticalError),
        icon: 'AiOutlineInfoCircle',
        isDisabled: true,
      },
      {
        id: 'online-date',
        name: formatMessage(notificationListMessages.notificationTypeOnlineDate),
        icon: 'AiOutlineCalendar',
        isDisabled: true,
      },
    ],
  },
]

const getNotificationMeta = (notificationType, intl) => {
  const options = groupedOptions(intl)
  const allOptions = union(...options.map(({ options }) => options))
  const { name, icon } = allOptions.find(({ id }) => id === notificationType) || {}
  return { name, value: notificationType, icon }
}

export default getFormConfigWithData
export { getNotificationMeta }
