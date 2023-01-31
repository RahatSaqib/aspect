import React from 'react'
import { Grid } from '@mui/material'
import useI18n from '../../hooks/useI18n'
import ColumnName from './components/ColumnName'
import DashboardCard from './components/DashboardCard'
import DashboardLink from './components/DashboardLink'
import messages from './PkDashboard.Messages'

const MtbXdrColumn2 = ({ data }) => {
  const { formatMessage } = useI18n()
  return (
    <Grid lg={4} style={{ padding: '8px 8px 0' }}>
      <ColumnName title={formatMessage(messages.titlemtbXdr)} />
      <DashboardCard title={formatMessage(messages.mtbXdrTesting)}>
        <DashboardLink to="" label={formatMessage(messages.TCurrent)} value={data.TCurrent} />
        <DashboardLink to="" label={formatMessage(messages.TNationalTrend)} value={data.TNationalTrend} />
        <DashboardLink to="" label={formatMessage(messages.TProvincialComparison)} value={data.TProvincialComparison} />
      </DashboardCard>
      <DashboardCard title={formatMessage(messages.mtbXdrmtbDetection)}>
        <DashboardLink to="" label={formatMessage(messages.DCurrent)} value={data.DCurrent} />
        <DashboardLink to="" label={formatMessage(messages.DNationalTrend)} value={data.DNationalTrend} />
        <DashboardLink to="" label={formatMessage(messages.DProvincialComparison)} value={data.DProvincialComparison} />
        <DashboardLink to="" label={formatMessage(messages.DTestingDiagnosis)} value={data.DTestingDiagnosis} />
      </DashboardCard>
      <DashboardCard title={formatMessage(messages.mtbXdrFQResistance)}>
        <DashboardLink to="" label={formatMessage(messages.FQCurrent)} value={data.FQCurrent} />
        <DashboardLink to="" label={formatMessage(messages.FQNationalTrend)} value={data.FQNationalTrend} />
        <DashboardLink
          to=""
          label={formatMessage(messages.FQProvincialComparison)}
          value={data.FQProvincialComparison}
        />
      </DashboardCard>
    </Grid>
  )
}

export default MtbXdrColumn2
