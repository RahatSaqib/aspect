import React from 'react'
import { Card, CardContent, Divider } from '@mui/material'
import { useIntl } from 'react-intl'
import messages from '../PkDashboard.Messages'
import DataRow from './DataRow'

const SummaryCard = ({ items }) => {
  const { formatMessage } = useIntl()
  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: '16px' } }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const dataRowProps = {
            label: formatMessage(messages[item.key]),
            value: item.value.toString(),
          }
          if (item.valueTooltipKey) {
            dataRowProps.valueTooltip = formatMessage(messages[item.valueTooltipKey])
          }
          return (
            <React.Fragment key={index}>
              <DataRow {...dataRowProps} />
              {!isLast && <Divider />}
            </React.Fragment>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default SummaryCard
