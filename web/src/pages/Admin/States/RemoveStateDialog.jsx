import React from 'react'
import { Button, CircularProgress } from '@mui/material'
import { useIntl } from 'react-intl'
import { useQueryClient } from 'react-query'
import { ADMIN_STATES_KEYS } from '../../../hooks/admin/adminKeys'
import { useDeleteState } from '../../../hooks/admin/useDeleteState'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import messages from '../messages'

export function RemoveStateDialog({ open, state, onOpenChange }) {
  const { formatMessage } = useIntl()
  const client = useQueryClient()
  const { mutate: deleteState, isLoading } = useDeleteState({
    onSuccess: () => {
      client.refetchQueries(ADMIN_STATES_KEYS)
      onOpenChange(false)
    },
  })

  return (
    <AspectDialog
      actions={[
        <Button color="primary" onClick={() => onOpenChange(false)}>
          {formatMessage(messages.cancel)}
        </Button>,
        <Button
          disabled={isLoading}
          color="primary"
          variant="contained"
          onClick={() => deleteState({ stateId: state?.id })}
        >
          {isLoading ? <CircularProgress size={20} /> : formatMessage(messages.yes)}
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
