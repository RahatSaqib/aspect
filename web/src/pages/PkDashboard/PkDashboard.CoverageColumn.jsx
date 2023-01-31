import React from 'react'
import { Grid } from '@mui/material'
import useI18n from '../../hooks/useI18n'
import ColumnName from './components/ColumnName'
import DashboardCard from './components/DashboardCard'
import DashboardLink from './components/DashboardLink'
import messages from './PkDashboard.Messages'

const CoverageColumn = ({ data }) => {
  const { formatMessage } = useI18n()
  return (
    <Grid lg={12 / 5} style={{ padding: '8px 8px 0' }}>
      <ColumnName title={formatMessage(messages.titlecoverage)} />
      <DashboardCard>
        <DashboardLink
          to="/dashboard/coverage/device"
          label={formatMessage(messages.genExpert)}
          value={data.genExpert}
        />
      </DashboardCard>
      <DashboardCard title={formatMessage(messages.coverageperformance)}>
        <DashboardLink
          to="/dashboard/coverage/utilization"
          label={formatMessage(messages.utilization)}
          value={data.utilization}
        />
        <DashboardLink
          to="/dashboard/coverage/error-rate"
          label={formatMessage(messages.errorRate)}
          value={data.errorRate}
        />
      </DashboardCard>
    </Grid>
  )
}

export default CoverageColumn
