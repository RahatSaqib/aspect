import React from 'react'
import { Button, CircularProgress } from '@mui/material'
import { useIntl } from 'react-intl'
import { useQueryClient } from 'react-query'
import { ADMIN_STATES_KEYS } from '../../../hooks/admin/adminKeys'
import { useDeleteState } from '../../../hooks/admin/useDeleteState'
import { STATE_KEY } from '../../../hooks/geography/geographyKeys'
import useAuthState from '../../../hooks/useAuthState'
import { getCustomMessage } from '../../../messages'
import AspectDialog from '../../../components/shared/AspectDialog'
import messages from '../messages'

export function RemoveStateDialog({ open, state, onOpenChange }) {
  const { formatMessage } = useIntl()
  const client = useQueryClient()
  const user = useAuthState()
  const { mutate: deleteState, isLoading } = useDeleteState({
    onSuccess: () => {
      client.refetchQueries(ADMIN_STATES_KEYS)
      client.refetchQueries(STATE_KEY)
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
      title={`${formatMessage(messages.delete)} ${getCustomMessage(formatMessage, messages, 'state', user)}`}
      onClose={() => onOpenChange(false)}
    >
      {formatMessage(messages.deleteConfirmation, { entity: getCustomMessage(formatMessage, messages, 'state', user) })}
    </AspectDialog>
  )
}
