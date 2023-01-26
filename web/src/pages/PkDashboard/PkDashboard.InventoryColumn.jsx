import React from 'react'
import { Grid } from '@mui/material'
import useI18n from '../../hooks/useI18n'
import ColumnName from './components/ColumnName'
import DashboardCard from './components/DashboardCard'
import DashboardLink from './components/DashboardLink'
import messages from './messages'

const InventoryColumn = ({ data }) => {
  const { formatMessage } = useI18n()
  return (
    <Grid lg={12 / 5} style={{ padding: '8px 8px 0' }}>
      <ColumnName title={formatMessage(messages.titleinventory)} />
      <DashboardCard>
        <DashboardLink
          to="/dashboard/inventory/overview"
          label={formatMessage(messages.overview)}
          value={data.overview}
        />
      </DashboardCard>
    </Grid>
  )
}

export default InventoryColumn
