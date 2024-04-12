import React from 'react'
import { Button, CircularProgress } from '@mui/material'
import { useIntl } from 'react-intl'
import { useQueryClient } from 'react-query'
import { ADMIN_LGAS_KEYS } from '../../../hooks/admin/adminKeys'
import { useDeleteLga } from '../../../hooks/admin/useDeleteLga'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import messages from '../messages'

export function RemoveLgaDialog({ open, lga, onOpenChange }) {
  const { formatMessage } = useIntl()
  const client = useQueryClient()
  const { mutate: deleteLga, isLoading } = useDeleteLga({
    onSuccess: () => {
      client.refetchQueries(ADMIN_LGAS_KEYS)
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
      title={formatMessage(messages.removeLga)}
      onClose={() => onOpenChange(false)}
    >
      {formatMessage(messages.removeLgaConfirmation)}
    </AspectDialog>
  )
}
