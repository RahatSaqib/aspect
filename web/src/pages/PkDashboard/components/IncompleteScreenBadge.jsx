import React from 'react'
import { Box, Typography } from '@mui/material'
import { useIntl } from 'react-intl'
import messages from '../PkDashboard.Messages'

export default function IncompleteScreenBadge() {
  const { formatMessage } = useIntl()
  return (
    <Box sx={{ backgroundColor: 'red', p: '10px', mt: 3, ml: '16px', borderRadius: 5 }}>
      <Typography variant="button" sx={{ color: '#fff', fontStyle: 'italic' }}>
        {formatMessage(messages.incompleteScreen)}
      </Typography>
    </Box>
  )
}
