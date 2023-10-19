import React from 'react'
import { defineMessages } from 'react-intl'
import useI18n from '../../hooks/useI18n'
import AspectDialog from '../../oldComponents/shared/AspectDialog'

const IdleDialog = () => {
  const { formatMessage } = useI18n()

  return (
    <AspectDialog title={formatMessage(messages.title)} modal open>
      <span>{formatMessage(messages.help)}</span>
    </AspectDialog>
  )
}

export default IdleDialog

const messages = defineMessages({
  title: { id: 'pages.IdleDialog.title', defaultMessage: 'Automatic Logout' },
  help: {
    id: 'shared.IdleDialog.help',
    defaultMessage:
      'You will be logged out automatically in one minute due to inactivity. To stay logged in, hit any button or move your mouse.',
  },
})
