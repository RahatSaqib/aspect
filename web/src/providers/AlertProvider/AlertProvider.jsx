import React, { useState } from 'react'
import { Typography } from '@mui/material'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { hideServiceDegradation, useServiceDegradation } from '../../store/serviceDegradationStore'

const ErrorAlert = ({ message, children }) => {
  return (
    <Stack>
      <Alert severity="error" sx={{ zIndex: theme => theme.zIndex.snackbar, alignItems: 'center' }}>
        <Typography variant="body1">{message}</Typography>
      </Alert>
      {children}
    </Stack>
  )
}

const InfoAlert = ({ message, children }) => {
  const [open, setOpen] = useState(true)
  return (
    <Stack>
      {open ? (
        <Alert
          action={
            <Button
              onClick={() => {
                setOpen(false)
                hideServiceDegradation()
              }}
              color="inherit"
              size="small"
            >
              Skip
            </Button>
          }
          severity="warning"
          sx={{ zIndex: theme => theme.zIndex.snackbar, alignItems: 'center' }}
        >
          <Typography variant="body1">{message}</Typography>
        </Alert>
      ) : null}

      {children}
    </Stack>
  )
}

export function AlertProvider({ children }) {
  const alert = useServiceDegradation()
  if (alert) {
    return alert.variant === 'error' ? (
      <ErrorAlert message={alert.message}>{children}</ErrorAlert>
    ) : (
      <InfoAlert message={alert.message}>{children}</InfoAlert>
    )
  }
  return children
}
