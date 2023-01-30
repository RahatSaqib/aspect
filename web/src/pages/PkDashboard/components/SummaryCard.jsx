import React from 'react'
import { Card, Stack, CardContent, Typography, Divider } from '@mui/material'
import useI18n from '../../../hooks/useI18n'
import messages from '../PkDashboard.Messages'

const SummaryCard = ({ item }) => {
  const { formatMessage } = useI18n()
  return (
    <Card>
      <CardContent sx={{ p: 2, pb: '16px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontSize: 14 }}>{formatMessage(messages[item.main.key])}</Typography>
          <Typography sx={{ fontSize: 24, color: '#009688' }}>{item.main.value}</Typography>
        </Stack>
        <Divider />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontSize: 14 }}>{formatMessage(messages[item.secondary.key])}</Typography>
          <Typography sx={{ fontSize: 24, color: '#009688' }}>{item.secondary.value}</Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default SummaryCard
