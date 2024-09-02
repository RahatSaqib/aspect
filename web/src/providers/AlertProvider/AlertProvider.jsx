import React, { useState } from 'react'
import { Typography } from '@mui/material'
import Alert from '@mui/material/Alert'
import Backdrop from '@mui/material/Backdrop'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useDevToolsStatus } from '../../hooks/useDevToolsStatus'

const ErrorAlert = ({ message, children }) => {
  const isDevToolsOpen = useDevToolsStatus()
  return (
    <Stack>
      <Alert severity="error" sx={{ zIndex: theme => theme.zIndex.drawer + 2, alignItems: 'center' }}>
        <Typography variant="body1">{message}</Typography>
      </Alert>
      <Backdrop sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }} open />
      {!isDevToolsOpen ? children : null}
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
            <Button onClick={() => setOpen(false)} color="inherit" size="small">
              Continue
            </Button>
          }
          severity="warning"
          sx={{ zIndex: theme => theme.zIndex.drawer + 2, alignItems: 'center' }}
        >
          <Typography variant="body1">{message}</Typography>
        </Alert>
      ) : null}

      {children}
    </Stack>
  )
}

export function AlertProvider({ children }) {
  return <ErrorAlert message="Aspect is shutdown , Please consider to update the contract!">{children}</ErrorAlert>
}
