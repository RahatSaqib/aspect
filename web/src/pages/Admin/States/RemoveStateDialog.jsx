import React from 'react'
import { Button } from '@mui/material'
import { useIntl } from 'react-intl'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import messages from '../messages'

export function RemoveStateDialog({ open, onOpenChange }) {
  const { formatMessage } = useIntl()
  return (
    <AspectDialog
      actions={[
        <Button color="primary" onClick={() => onOpenChange(false)}>
          {formatMessage(messages.cancel)}
        </Button>,
        <Button color="primary" variant="contained" onClick={() => {}}>
          {formatMessage(messages.yes)}
        </Button>,
      ]}
      maxWidth="sm"
      open={open}
      title={formatMessage(messages.removeState)}
      onClose={() => onOpenChange(false)}
    >
      {formatMessage(messages.removeStateConfirmation)}
    </AspectDialog>
  )
}
