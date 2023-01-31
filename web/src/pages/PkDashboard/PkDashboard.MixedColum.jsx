import React from 'react'
import { Grid } from '@mui/material'
import useI18n from '../../hooks/useI18n'
import ColumnName from './components/ColumnName'
import DashboardCard from './components/DashboardCard'
import DashboardLink from './components/DashboardLink'
import messages from './PkDashboard.Messages'

const MixedColum = ({ coverage, inventory, other }) => {
  const { formatMessage } = useI18n()
  return (
    <Grid lg={4} style={{ padding: '8px 8px 0' }}>
      <ColumnName title={formatMessage(messages.titlecoverage)} />
      <DashboardCard>
        <DashboardLink
          to="/dashboard/coverage/device"
          label={formatMessage(messages.genExpert)}
          value={coverage.genExpert}
        />
      </DashboardCard>
      <DashboardCard title={formatMessage(messages.coverageperformance)}>
        <DashboardLink
          to="/dashboard/coverage/utilization"
          label={formatMessage(messages.utilization)}
          value={coverage.utilization}
        />
        <DashboardLink
          to="/dashboard/coverage/error-rate"
          label={formatMessage(messages.errorRate)}
          value={coverage.errorRate}
        />
      </DashboardCard>
      <ColumnName title={formatMessage(messages.titleinventory)} />
      <DashboardCard>
        <DashboardLink
          to="/dashboard/inventory/overview"
          label={formatMessage(messages.overview)}
          value={inventory.overview}
        />
      </DashboardCard>
      <ColumnName title={formatMessage(messages.titleother)} />
      <DashboardCard>
        <DashboardLink to="/dashboard/other/covid" label={formatMessage(messages.covid)} value={other.covid} />
        <DashboardLink to="/dashboard/other/hiv" label={formatMessage(messages.hiv)} value={other.hiv} />
      </DashboardCard>
    </Grid>
  )
}

export default MixedColum
