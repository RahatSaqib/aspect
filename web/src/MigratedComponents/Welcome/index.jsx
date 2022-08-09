import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import useI18n from '../../Hooks/i18n/useI18n'
import messages from './messages'

const Welcome = () => {
  const { formatMessage } = useI18n()
  const navigate = useNavigate()
  const user = useSelector(({ user }) => user.toJS())

  useEffect(() => {
    if (user?.jwt?.permissions?.length > 0) {
      navigate('/')
    }
  }, [user, navigate])

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 'calc(100vh - 120px)',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, minWidth: 380, width: '60vw' }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          {formatMessage(messages.welcome)}
        </Typography>
        <Typography variant="subtitle1">{formatMessage(messages.setupNeeded)}</Typography>
      </Paper>
    </Box>
  )
}

export default Welcome
