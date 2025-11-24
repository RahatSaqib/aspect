import React from 'react'
import { Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import { Loading } from '../../cleanComponents'
import useAuthState from '../../hooks/useAuthState'
import { getCustomMessage } from '../../messages'
import COUNTRY_ISO_MAPPING from '../../utils/consts/Countries/CONSTS'
import ColumnName from './components/ColumnName'
import DashboardCard from './components/DashboardCard'
import DashboardLink from './components/DashboardLink'
import PkPage from './components/PkPage'
import SummaryCard from './components/SummaryCard'
import useResultOverview from './hooks/useResultOverview'
import messages from './PkDashboard.Messages'

const PkDashboard = () => {
  const { formatMessage } = useIntl()
  const { data: resultOverview, isLoading } = useResultOverview()
  const user = useAuthState()
  const stateName = getCustomMessage(formatMessage, messages, 'state', user, { entity: 'state' })

  return (
    <PkPage title={formatMessage(messages.aspectDashboard)} full>
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        <Grid item lg={4} style={{ padding: '16px 8px 0' }}>
          {isLoading ? (
            <Loading />
          ) : (
            <SummaryCard
              items={[
                {
                  key: user.isCountry('PK') ? 'molecularAssay' : 'totalReportableTBTests',
                  value: user.isCountry('PK') ? resultOverview.total1Year : resultOverview.mtbValidWithIndeterminate,
                  valueTooltipKey: user.isCountry('PK') ? 'peopleTestedRifTooltip' : 'reportableCount',
                },
                {
                  key: 'molecularAssay25',
                  value: user.isCountry('PK')
                    ? resultOverview.totalToday
                    : resultOverview.mtbValidWithIndeterminateToday,
                },
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
                {
                  key: user.isCountry('PK') ? 'TB' : 'totalTBDetectedInCurrentYear',
                  value: resultOverview.mtbDetected1Year,
                  info: user.isCountry('PK')
                    ? undefined
                    : `${(
                        (resultOverview.mtbDetected1Year /
                          (user.isCountry('PK')
                            ? resultOverview.total1Year
                            : resultOverview.mtbValidWithIndeterminate)) *
                        100
                      ).toFixed()}%`,
                  valueTooltipKey: user.isCountry('PK') ? undefined : 'countIncludesMTBAndTrace',
                },
                { key: 'TB25', value: resultOverview.mtbDetected1Day },
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
                {
                  key: user.isCountry('PK') ? 'RTTB' : 'totalRRTBDetectedInCurrentYear',
                  value: resultOverview.rifDetected1Year,
                  info: user.isCountry('PK')
                    ? undefined
                    : `${((resultOverview.rifDetected1Year / resultOverview.mtbDetected1Year) * 100).toFixed()}%`,
                },
                { key: 'RTTB25', value: resultOverview.rifDetected1Day },
              ]}
            />
          )}
        </Grid>
        <Grid item lg={4} style={{ padding: '8px 8px 0' }}>
          <ColumnName title={formatMessage(messages.titlemtbRif)} />
          <DashboardCard title={formatMessage(messages.mtbRifTbTesting)}>
            <DashboardLink to="/dashboard/rif/current-testing" label={formatMessage(messages.CurrentTBTesting)} />
            <DashboardLink to="/dashboard/rif/national-testing-trend" label={formatMessage(messages.TbNationalTrend)} />
            <DashboardLink
              to="/dashboard/rif/provincial-testing-trend"
              label={`${stateName}  ${formatMessage(messages.TBTestingTrend)}`}
            />
          </DashboardCard>
          <DashboardCard title={formatMessage(messages.mtbRifTbDiagnosis)}>
            <DashboardLink to="/dashboard/rif/current-diagnosis" label={formatMessage(messages.TbDCurrent)} />
            <DashboardLink to="/dashboard/rif/national-diagnosis" label={formatMessage(messages.TbDNationalTrend)} />
            <DashboardLink
              to="/dashboard/rif/provincial-diagnosis-trend"
              label={`${stateName} ${formatMessage(messages.TBDiagnosisTrendsComparison)}`}
            />
            <DashboardLink to="/dashboard/rif/test-diag-trend" label={formatMessage(messages.TbDTestingDiagnosis)} />
          </DashboardCard>
          <DashboardCard title={formatMessage(messages.mtbRifRrtbDiagnosis)}>
            <DashboardLink to="/dashboard/rif/current-rrtb-diagnosis" label={formatMessage(messages.RRCurrent)} />
            <DashboardLink to="/dashboard/rif/national-rtb-trends" label={formatMessage(messages.RRNationalTrend)} />
            <DashboardLink
              to="/dashboard/rif/provincial-rrtb-trend-comparison"
              label={`${stateName} ${formatMessage(messages.RRTBDiagnosisTrends)}`}
            />
            <DashboardLink to="/dashboard/rif/rrtb-test-diagnosis" label={formatMessage(messages.RRTestingDiagnosis)} />
          </DashboardCard>
        </Grid>
        <Grid item lg={4} style={{ padding: '8px 8px 0' }}>
          <ColumnName title={formatMessage(messages.titlemtbXdr)} />
          <DashboardCard title={formatMessage(messages.mtbXdrTesting)}>
            <DashboardLink
              to="/dashboard/xdr/current-testing"
              label={formatMessage(
                user.isCountry(COUNTRY_ISO_MAPPING.PAK) ? messages.TCurrent : messages.currentMtbXdrTesting
              )}
            />
            <DashboardLink
              to="/dashboard/xdr/national-testing-trend"
              label={formatMessage(
                user.isCountry(COUNTRY_ISO_MAPPING.PAK) ? messages.TNationalTrend : messages.nationalMtbXdrTestingTrends
              )}
            />
            <DashboardLink
              to="/dashboard/xdr/provincial-testing-trend"
              label={
                user.isCountry(COUNTRY_ISO_MAPPING.PAK)
                  ? `${stateName} ${formatMessage(messages.TBDiagnosisTrendsComparison)}`
                  : `${stateName} ${formatMessage(messages.MtbXdrTestingTrends)}`
              }
            />
            <DashboardLink to="/dashboard/xdr/by-device" label={formatMessage(messages.XDRByDevice)} />
            <DashboardLink
              to="/dashboard/xdr/data-visualisation-for-xdr-resistance"
              label={formatMessage(messages.dataVisualisationForXDR)}
            />
          </DashboardCard>
          <DashboardCard title={formatMessage(messages.mtbXdrmtbDetection)}>
            <DashboardLink to="/dashboard/xdr/current-diagnosis" label={formatMessage(messages.DCurrentPending)} />
            <DashboardLink
              to="/dashboard/xdr/national-diagnosis"
              label={formatMessage(
                user.isCountry(COUNTRY_ISO_MAPPING.PAK) ? messages.DNationalTrend : messages.nationalMtbDetectionTrends
              )}
            />
            <DashboardLink
              to="/dashboard/xdr/provincial-diagnosis-trend"
              label={
                user.isPakistan
                  ? `${stateName} ${formatMessage(messages.TBDiagnosisTrendsComparison)}`
                  : `${stateName} ${formatMessage(messages.MtbDetectionTrendsComparison)}`
              }
            />
            <DashboardLink
              to="/dashboard/xdr/testing-diagnosis-trend"
              label={formatMessage(
                user.isCountry(COUNTRY_ISO_MAPPING.PAK)
                  ? messages.XDRTestingandDiagnosisTrends
                  : messages.xdrTestingAndMtbDetectionTrends
              )}
            />
          </DashboardCard>
          <DashboardCard title={formatMessage(messages.mtbXdrFQResistance)}>
            <DashboardLink
              to="/dashboard/xdr/current-fq-detection"
              label={formatMessage(messages.CurrentFQDetection)}
            />
            <DashboardLink to="/dashboard/xdr/national-fq" label={formatMessage(messages.NationalFQResistanceTrend)} />
            <DashboardLink
              to="/dashboard/xdr/provincial-fq-diagnosis-trend"
              label={`${stateName} ${formatMessage(messages.FQDiagnosisTrends)}`}
            />
            <DashboardLink
              to="/dashboard/xdr/gx-testing-and-diagnosis"
              label={formatMessage(messages.fqInhTestingDiagnosis)}
            />
          </DashboardCard>
        </Grid>
        <Grid item lg={4} style={{ padding: '8px 8px 0' }}>
          <ColumnName title={formatMessage(messages.titlecoverage)} />
          <DashboardCard>
            <DashboardLink to="/dashboard/coverage/device" label={formatMessage(messages.genExpert)} />
          </DashboardCard>
          <DashboardCard title={formatMessage(messages.coverageperformance)}>
            <DashboardLink to="/dashboard/coverage/utilization" label={formatMessage(messages.utilization)} />
            <DashboardLink
              to="/dashboard/coverage/error-rate"
              label={formatMessage(!user.isCountry('PK') ? messages.errorRatePageTitle : messages.errorRate)}
            />
          </DashboardCard>
          <ColumnName title={formatMessage(messages.titleinventory)} />
          <DashboardCard>
            <DashboardLink to="/dashboard/inventory/overview" label={formatMessage(messages.overview)} />
          </DashboardCard>
          <ColumnName title={formatMessage(messages.titleother)} />
          <DashboardCard>
            <DashboardLink to="/dashboard/other/covid" label={formatMessage(messages.covidTesting)} />
            <DashboardLink to="/dashboard/other/hiv" label={formatMessage(messages.hiv)} />
          </DashboardCard>
        </Grid>
      </Grid>
    </PkPage>
  )
}

export default PkDashboard
