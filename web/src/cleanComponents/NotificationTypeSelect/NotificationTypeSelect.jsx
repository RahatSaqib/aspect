import React from 'react'
import useNotificationType from '../../hooks/notification/useNotificationType'
import AspectSelect from '../AspectSelect'

export default function NotificationTypeSelect(props) {
  const { typeCategoryId, ...rest } = props
  const { isLoading, data: notificationType } = useNotificationType(typeCategoryId, { enabled: !!typeCategoryId })
  return <AspectSelect {...rest} isLoading={isLoading} options={notificationType} itemToString={i => i?.name ?? ''} />
}
