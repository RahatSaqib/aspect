import React from 'react'
import { Card, CardContent, Divider } from '@mui/material'
import useI18n from '../../../hooks/useI18n'
import messages from '../PkDashboard.Messages'
import DataRow from './DataRow'

const SummaryCard = ({ item }) => {
  const { formatMessage } = useI18n()
  return (
    <Card>
      <CardContent sx={{ p: 2, pb: '16px !important' }}>
        <DataRow label={formatMessage(messages[item.main.key])} value={item.main.value} />
        <Divider />
        <DataRow label={formatMessage(messages[item.secondary.key])} value={item.secondary.value} />
      </CardContent>
    </Card>
  )
}

export default SummaryCard
