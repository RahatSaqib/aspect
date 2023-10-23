import React from 'react'
import useNotificationCategoryType from '../../hooks/notification/useNotificationCategoryType'
import AspectSelect from '../AspectSelect'

export default function NotificationCategoryTypeSelect(props) {
  const { isLoading, data: notificationType } = useNotificationCategoryType()
  return <AspectSelect {...props} isLoading={isLoading} options={notificationType} itemToString={i => i?.name ?? ''} />
}
