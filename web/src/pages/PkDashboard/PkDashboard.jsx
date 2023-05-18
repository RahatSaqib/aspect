import React from 'react'
import { Grid } from '@mui/material'
import Loading from '../../components/Loading'
import useI18n from '../../hooks/useI18n'
import ColumnName from './components/ColumnName'
import DashboardCard from './components/DashboardCard'
import DashboardLink from './components/DashboardLink'
import PkPage from './components/PkPage'
import SummaryCard from './components/SummaryCard'
import useResultOverview from './hooks/useResultOverview'
import messages from './PkDashboard.Messages'

const PkDashboard = () => {
  const { formatMessage } = useI18n()
  const { data: resultOverview, isLoading } = useResultOverview()

  return (
    <PkPage title={formatMessage(messages.aspectDashboard)} full>
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        <Grid item lg={4} style={{ padding: '16px 8px 0' }}>
          {isLoading ? (
            <Loading />
          ) : (
            <SummaryCard
              items={[
                { key: 'molecularAssay', value: resultOverview.total1Year },
                { key: 'molecularAssay24', value: resultOverview.total1Day },
              ]}
            />
          )}
        </Grid>
        <Grid item lg={4} style={{ padding: '16px 8px 0' }}>
          {isLoading ? (
            <Loading />
          ) : (
            <SummaryCard
              items={[
                { key: 'TB', value: resultOverview.mtbDetected1Year },
                { key: 'TB24', value: resultOverview.mtbDetected1Day },
              ]}
            />
          )}
        </Grid>
        <Grid item lg={4} style={{ padding: '16px 8px 0' }}>
          {isLoading ? (
            <Loading />
          ) : (
            <SummaryCard
              items={[
                { key: 'RTTB', value: resultOverview.rifDetected1Year },
                { key: 'RTTB24', value: resultOverview.rifDetected1Day },
              ]}
            />
          )}
        </Grid>
        <Grid item lg={4} style={{ padding: '8px 8px 0' }}>
          <ColumnName title={formatMessage(messages.titlemtbRif)} />
          <DashboardCard title={formatMessage(messages.mtbRifTbTesting)}>
            <DashboardLink to="/dashboard/rif/current-testing" label={formatMessage(messages.TbCurrent)} />
            <DashboardLink to="/dashboard/rif/national-testing-trend" label={formatMessage(messages.TbNationalTrend)} />
            <DashboardLink
              to="/dashboard/rif/provincial-testing-trend"
              label={formatMessage(messages.TbProvincialComparison)}
            />
            <DashboardLink to="" label={formatMessage(messages.TbSubprovincialTrend)} />
          </DashboardCard>
          <DashboardCard title={formatMessage(messages.mtbRifTbDiagnosis)}>
            <DashboardLink to="/dashboard/rif/current-diagnosis" label={formatMessage(messages.TbDCurrent)} />
            <DashboardLink to="/dashboard/rif/national-diagnosis" label={formatMessage(messages.TbDNationalTrend)} />
            <DashboardLink
              to="/dashboard/rif/provincial-diagnosis-trend"
              label={formatMessage(messages.TbDProvincialComparison)}
            />
            <DashboardLink to="/dashboard/rif/test-diag-trend" label={formatMessage(messages.TbDTestingDiagnosis)} />
          </DashboardCard>
          <DashboardCard title={formatMessage(messages.mtbRifRrtbDiagnosis)}>
            <DashboardLink to="/dashboard/rif/current-rrtb-diagnosis" label={formatMessage(messages.RRCurrent)} />
            <DashboardLink to="/dashboard/rif/national-rtb-trends" label={formatMessage(messages.RRNationalTrend)} />
            <DashboardLink
              to="/dashboard/rif/provincial-rrtb-trend-comparison"
              label={formatMessage(messages.RRProvincialComparison)}
            />
            <DashboardLink to="" label={formatMessage(messages.RRTestingDiagnosis)} />
          </DashboardCard>
        </Grid>
        <Grid item lg={4} style={{ padding: '8px 8px 0' }}>
          <ColumnName title={formatMessage(messages.titlemtbXdr)} />
          <DashboardCard title={formatMessage(messages.mtbXdrTesting)}>
            <DashboardLink to="/dashboard/xdr/current-testing" label={formatMessage(messages.TCurrent)} />
            <DashboardLink to="/dashboard/xdr/national-testing-trend" label={formatMessage(messages.TNationalTrend)} />
            <DashboardLink
              to="/dashboard/xdr/provincial-testing-trend"
              label={formatMessage(messages.TProvincialComparison)}
            />
          </DashboardCard>
          <DashboardCard title={formatMessage(messages.mtbXdrmtbDetection)}>
            <DashboardLink to="/dashboard/xdr/current-diagnosis" label={formatMessage(messages.DCurrent)} />
            <DashboardLink to="" label={formatMessage(messages.DNationalTrend)} />
            <DashboardLink
              to="/dashboard/xdr/provincial-diagnosis-trend"
              label={formatMessage(messages.DProvincialComparison)}
            />
            <DashboardLink
              to="/dashboard/xdr/gx-testing-and-diagnosis"
              label={formatMessage(messages.DTestingDiagnosis)}
            />
          </DashboardCard>
          <DashboardCard title={formatMessage(messages.mtbXdrFQResistance)}>
            <DashboardLink to="" label={formatMessage(messages.FQCurrent)} />
            <DashboardLink to="" label={formatMessage(messages.FQNationalTrend)} />
            <DashboardLink to="" label={formatMessage(messages.FQProvincialComparison)} />
          </DashboardCard>
        </Grid>
        <Grid item lg={4} style={{ padding: '8px 8px 0' }}>
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
      </Grid>
    </PkPage>
  )
}

export default PkDashboard
