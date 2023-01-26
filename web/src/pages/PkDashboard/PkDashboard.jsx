import React from 'react'
import { Container, Grid } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useParams } from 'react-router'
import useI18n from '../../hooks/useI18n'
import SummaryCard from './components/SummaryCard'
import messages from './messages'
import CoverageColumn from './PkDashboard.CoverageColumn'
import InventoryColumn from './PkDashboard.InventoryColumn'
import MixedColum from './PkDashboard.MixedColum'
import MtbRifColumn from './PkDashboard.MtbRifColumn'
import MtbRifColumn2 from './PkDashboard.MtbRifColumn2'
import MtbXdrColumn from './PkDashboard.MtbXdrColumn'
import MtbXdrColumn2 from './PkDashboard.MtbXdrColumn2'
import OtherColumn from './PkDashboard.OtherColumn'

const mock = {
  summary: [
    { main: { key: 'molecularAssay', value: '536,412' }, secondary: { key: 'molecularAssay24', value: '1,932' } },
    { main: { key: 'TB', value: '61,137' }, secondary: { key: 'TB24', value: '423' } },
    { main: { key: 'RTTB', value: '2,274' }, secondary: { key: 'RTTB24', value: '13' } },
  ],
  mtbRif: {
    TbCurrent: '123',
    TbNationalTrend: '456',
    TbProvincialComparison: '789',
    TbDCurrent: '123',
    TbDNationalTrend: '456',
    TbDProvincialComparison: '789',
    TbDTestingDiagnosis: '1.2K',
    RRCurrent: '123',
    RRNationalTrend: '456',
    RRProvincialComparison: '789',
    RRTestingDiagnosis: '1.2K',
  },
  mtbXdr: {
    TCurrent: '123',
    TNationalTrend: '456',
    TProvincialComparison: '789',
    DCurrent: '123',
    DNationalTrend: '456',
    DProvincialComparison: '789',
    DTestingDiagnosis: '1.2K',
    FQCurrent: '123',
    FQNationalTrend: '456',
    FQProvincialComparison: '789',
  },
  coverage: { genExpert: '123', utilization: '456', errorRate: '789' },
  inventory: { overview: '123' },
  other: { covid: '123', hiv: '456' },
}

const PkDashboard = () => {
  const { cols } = useParams()
  const { formatMessage } = useI18n()
  const data = mock // replace with useQuery()
  return (
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
            {cols ? (
              <>
                <MtbRifColumn2 data={data.mtbRif} />
                <MtbXdrColumn2 data={data.mtbXdr} />
                <MixedColum coverage={data.coverage} inventory={data.inventory} other={data.other} />{' '}
              </>
            ) : (
              <>
                <MtbRifColumn data={data.mtbRif} />
                <MtbXdrColumn data={data.mtbXdr} />
                <CoverageColumn data={data.coverage} />
                <InventoryColumn data={data.inventory} />
                <OtherColumn data={data.other} />
              </>
            )}
          </>
        ) : null}
      </Grid>
    </Container>
  )
}

export default PkDashboard
