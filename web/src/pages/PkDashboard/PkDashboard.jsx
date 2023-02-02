import React from 'react'
import { Container, Grid } from '@mui/material'
import { Helmet } from 'react-helmet'
import DetailHeader from '../../components/DetailHeader'
import useI18n from '../../hooks/useI18n'
import ColumnName from './components/ColumnName'
import DashboardCard from './components/DashboardCard'
import DashboardLink from './components/DashboardLink'
import SummaryCard from './components/SummaryCard'
import messages from './PkDashboard.Messages'

const mock = {
  summary: [
    { main: { key: 'molecularAssay', value: '32,536,412' }, secondary: { key: 'molecularAssay24', value: '1,932' } },
    { main: { key: 'TB', value: '61,137' }, secondary: { key: 'TB24', value: '423' } },
    { main: { key: 'RTTB', value: '2,274' }, secondary: { key: 'RTTB24', value: '13' } },
  ],
}

const PkDashboard = () => {
  const { formatMessage } = useI18n()
  const data = mock // replace with useQuery()
  return (
    <>
      <DetailHeader name={formatMessage(messages.aspectDashboard)} disableBack />
      <Container maxWidth sx={{ pb: 3, maxHeight: 'calc(100vh - 64px)', overflow: 'scroll' }}>
        <Helmet title={formatMessage(messages.aspectDashboard)} />
        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
          {data ? (
            <>
              {data.summary.map(s => (
                <Grid item xs={12 / data.summary.length} style={{ padding: '16px 8px 0' }}>
                  <SummaryCard key={s.key} item={s} />
                </Grid>
              ))}
              <Grid lg={4} style={{ padding: '8px 8px 0' }}>
                <ColumnName title={formatMessage(messages.titlemtbRif)} />
                <DashboardCard title={formatMessage(messages.mtbRifTbTesting)}>
                  <DashboardLink to="/dashboard/rif/current" label={formatMessage(messages.TbCurrent)} />
                  <DashboardLink to="" label={formatMessage(messages.TbNationalTrend)} />
                  <DashboardLink to="" label={formatMessage(messages.TbProvincialComparison)} />
                  <DashboardLink to="" label={formatMessage(messages.TbSubprovincialTrend)} />
                </DashboardCard>
                <DashboardCard title={formatMessage(messages.mtbRifTbDiagnosis)}>
                  <DashboardLink to="" label={formatMessage(messages.TbDCurrent)} />
                  <DashboardLink to="" label={formatMessage(messages.TbDNationalTrend)} />
                  <DashboardLink to="" label={formatMessage(messages.TbDProvincialComparison)} />
                  <DashboardLink to="" label={formatMessage(messages.TbDTestingDiagnosis)} />
                </DashboardCard>
                <DashboardCard title={formatMessage(messages.mtbRifRrtbDiagnosis)}>
                  <DashboardLink to="" label={formatMessage(messages.RRCurrent)} />
                  <DashboardLink to="" label={formatMessage(messages.RRNationalTrend)} />
                  <DashboardLink to="" label={formatMessage(messages.RRProvincialComparison)} />
                  <DashboardLink to="" label={formatMessage(messages.RRTestingDiagnosis)} />
                </DashboardCard>
              </Grid>{' '}
              <Grid lg={4} style={{ padding: '8px 8px 0' }}>
                <ColumnName title={formatMessage(messages.titlemtbXdr)} />
                <DashboardCard title={formatMessage(messages.mtbXdrTesting)}>
                  <DashboardLink to="" label={formatMessage(messages.TCurrent)} />
                  <DashboardLink to="" label={formatMessage(messages.TNationalTrend)} />
                  <DashboardLink to="" label={formatMessage(messages.TProvincialComparison)} />
                </DashboardCard>
                <DashboardCard title={formatMessage(messages.mtbXdrmtbDetection)}>
                  <DashboardLink to="" label={formatMessage(messages.DCurrent)} />
                  <DashboardLink to="" label={formatMessage(messages.DNationalTrend)} />
                  <DashboardLink to="" label={formatMessage(messages.DProvincialComparison)} />
                  <DashboardLink to="" label={formatMessage(messages.DTestingDiagnosis)} />
                </DashboardCard>
                <DashboardCard title={formatMessage(messages.mtbXdrFQResistance)}>
                  <DashboardLink to="" label={formatMessage(messages.FQCurrent)} />
                  <DashboardLink to="" label={formatMessage(messages.FQNationalTrend)} />
                  <DashboardLink to="" label={formatMessage(messages.FQProvincialComparison)} />
                </DashboardCard>
              </Grid>
              <Grid lg={4} style={{ padding: '8px 8px 0' }}>
                <ColumnName title={formatMessage(messages.titlecoverage)} />
                <DashboardCard>
                  <DashboardLink to="/dashboard/coverage/device" label={formatMessage(messages.genExpert)} />
                </DashboardCard>
                <DashboardCard title={formatMessage(messages.coverageperformance)}>
                  <DashboardLink to="/dashboard/coverage/utilization" label={formatMessage(messages.utilization)} />
                  <DashboardLink to="/dashboard/coverage/error-rate" label={formatMessage(messages.errorRate)} />
                </DashboardCard>
                <ColumnName title={formatMessage(messages.titleinventory)} />
                <DashboardCard>
                  <DashboardLink to="/dashboard/inventory/overview" label={formatMessage(messages.overview)} />
                </DashboardCard>
                <ColumnName title={formatMessage(messages.titleother)} />
                <DashboardCard>
                  <DashboardLink to="/dashboard/other/covid" label={formatMessage(messages.covid)} />
                  <DashboardLink to="/dashboard/other/hiv" label={formatMessage(messages.hiv)} />
                </DashboardCard>
              </Grid>
            </>
          ) : null}
        </Grid>
      </Container>
    </>
  )
}

export default PkDashboard
