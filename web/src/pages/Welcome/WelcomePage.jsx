import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { useIntl } from 'react-intl'
import messages from './messages'

const Welcome = () => {
  const { formatMessage } = useIntl()

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100% - 120px)' }}>
      <Paper elevation={3} sx={{ p: 4, minWidth: 380, width: '60vw' }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          {formatMessage(messages.welcome)}
        </Typography>
      </Paper>
    </Box>
  )
}

export default Welcome
