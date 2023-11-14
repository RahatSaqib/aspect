import React from 'react'
import { useIntl } from 'react-intl'
import AspectSelect from '../AspectSelect'
import { notificationCategories } from './fixture'

export default function NotificationCategorySelect(props) {
  const { formatMessage } = useIntl()
  return (
    <AspectSelect {...props} options={notificationCategories} itemToString={i => (i ? formatMessage(i.i18Name) : '')} />
  )
}
