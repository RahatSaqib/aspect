import React from 'react'
import useI18n from '../../hooks/useI18n'
import AspectSelect from '../AspectSelect'
import messages from './messages'

export default function NotificationCategoryTypeSelect(props) {
  const { formatMessage } = useI18n()

  const options = Object.keys(messages).map(key => ({ name: formatMessage(messages[key]) }))

  return <AspectSelect {...props} isLoading={false} options={options} itemToString={i => i.name} />
}
