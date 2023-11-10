import React from 'react'
import { defineMessages } from 'react-intl'
import { useIntl } from 'react-intl'
import AspectDialog from '../../oldComponents/shared/AspectDialog'

const IdleDialog = () => {
  const { formatMessage } = useIntl()

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
