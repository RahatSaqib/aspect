import React from 'react'
import useNotificationType from '../../hooks/notification/useNotificationType'
import AspectSelect from '../AspectSelect'

export default function NotificationTypeSelect(props) {
  const { categoryTypeId, ...rest } = props
  const { isLoading, data: notificationType } = useNotificationType(categoryTypeId)
  return <AspectSelect {...rest} isLoading={isLoading} options={notificationType} itemToString={i => i?.name ?? ''} />
}
