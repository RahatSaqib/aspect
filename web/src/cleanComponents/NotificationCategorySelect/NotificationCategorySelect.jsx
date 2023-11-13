import React from 'react'
import useI18n from '../../hooks/useI18n'
import AspectSelect from '../AspectSelect'
import { notificationCategories } from './fixture'

export default function NotificationCategorySelect(props) {
  const { formatMessage } = useI18n()
  return (
    <AspectSelect {...props} options={notificationCategories} itemToString={i => (i ? formatMessage(i.i18Name) : '')} />
  )
}
