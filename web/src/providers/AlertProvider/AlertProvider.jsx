import React, { useState } from 'react'
import { Typography } from '@mui/material'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useDispatch, useSelector } from 'react-redux'
import { hideServiceDegradation } from '../../store/ServiceDegradation'

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
  const dispatch = useDispatch()
  return (
    <Stack>
      {open ? (
        <Alert
          action={
            <Button
              onClick={() => {
                setOpen(false)
                dispatch(hideServiceDegradation())
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
  const alert = useSelector(state => state?.serviceDegradation)
  if (alert) {
    return alert.variant === 'error' ? (
      <ErrorAlert message={alert.message}>{children}</ErrorAlert>
    ) : (
      <InfoAlert message={alert.message}>{children}</InfoAlert>
    )
  }
  return children
}
