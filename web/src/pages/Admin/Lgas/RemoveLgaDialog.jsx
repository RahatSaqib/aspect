import React from 'react'
import { Button, CircularProgress } from '@mui/material'
import { useIntl } from 'react-intl'
import { useQueryClient } from 'react-query'
import AspectDialog from '../../../components/shared/AspectDialog'
import { ADMIN_LGAS_KEYS } from '../../../hooks/admin/adminKeys'
import { useDeleteLga } from '../../../hooks/admin/useDeleteLga'
import { LGA_KEY } from '../../../hooks/geography/geographyKeys'
import useAuthState from '../../../hooks/useAuthState'
import { getCustomMessage } from '../../../messages'
import messages from '../messages'

export function RemoveLgaDialog({ open, lga, onOpenChange }) {
  const { formatMessage } = useIntl()
  const client = useQueryClient()
  const user = useAuthState()
  const { mutate: deleteLga, isLoading } = useDeleteLga({
    onSuccess: () => {
      client.refetchQueries(ADMIN_LGAS_KEYS)
      client.removeQueries(LGA_KEY)
      onOpenChange(false)
    },
  })
  return (
    <AspectDialog
      actions={[
        <Button color="primary" onClick={() => onOpenChange(false)}>
          {formatMessage(messages.cancel)}
        </Button>,
        <Button disabled={isLoading} color="primary" variant="contained" onClick={() => deleteLga({ lgaId: lga?.id })}>
          {isLoading ? <CircularProgress size={20} /> : formatMessage(messages.yes)}
        </Button>,
      ]}
      maxWidth="sm"
      open={open}
      title={`${formatMessage(messages.delete)} ${getCustomMessage(formatMessage, messages, 'lga', user)}`}
      onClose={() => onOpenChange(false)}
    >
      {formatMessage(messages.deleteConfirmation, { entity: getCustomMessage(formatMessage, messages, 'lga', user) })}
    </AspectDialog>
  )
}
