import React from 'react'
import { Grid } from '@mui/material'
import useI18n from '../../hooks/useI18n'
import ColumnName from './components/ColumnName'
import DashboardCard from './components/DashboardCard'
import DashboardLink from './components/DashboardLink'
import messages from './PkDashboard.Messages'

const OtherColumn = ({ data }) => {
  const { formatMessage } = useI18n()
  return (
    <Grid lg={12 / 5} style={{ padding: '8px 8px 0' }}>
      <ColumnName title={formatMessage(messages.titleother)} />
      <DashboardCard>
        <DashboardLink to="/dashboard/other/covid" label={formatMessage(messages.covid)} value={data.covid} />
        <DashboardLink to="/dashboard/other/hiv" label={formatMessage(messages.hiv)} value={data.hiv} />
      </DashboardCard>
    </Grid>
  )
}

export default OtherColumn
