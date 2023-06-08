import React from 'react'
import { Card, CardContent, Divider } from '@mui/material'
import useI18n from '../../../hooks/useI18n'
import messages from '../PkDashboard.Messages'
import DataRow from './DataRow'

const SummaryCard = ({ items }) => {
  const { formatMessage } = useI18n()
  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: '16px' } }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <>
              <DataRow label={formatMessage(messages[item.key])} value={item.value.toString()} />
              {!isLast && <Divider />}
            </>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default SummaryCard
