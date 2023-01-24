import React from 'react'
import { Grid } from '@mui/material'
import useI18n from '../../hooks/useI18n'
import ColumnName from './components/ColumnName'
import DashboardCard from './components/DashboardCard'
import DashboardLink from './components/DashboardLink'
import messages from './messages'

const MtbRifColumn2 = ({ data }) => {
  const { formatMessage } = useI18n()
  return (
    <Grid lg={12 / 3} style={{ padding: '8px 8px 0' }}>
      <ColumnName title={formatMessage(messages.titlemtbRif)} />
      <DashboardCard title={formatMessage(messages.mtbRifTbTesting)}>
        <DashboardLink to="" label={formatMessage(messages.TbCurrent)} value={data.TbCurrent} />
        <DashboardLink to="" label={formatMessage(messages.TbNationalTrend)} value={data.TbNationalTrend} />
        <DashboardLink
          to=""
          label={formatMessage(messages.TbProvincialComparison)}
          value={data.TbProvincialComparison}
        />
      </DashboardCard>
      <DashboardCard title={formatMessage(messages.mtbRifTbDiagnosis)}>
        <DashboardLink to="" label={formatMessage(messages.TbDCurrent)} value={data.TbDCurrent} />
        <DashboardLink to="" label={formatMessage(messages.TbDNationalTrend)} value={data.TbDNationalTrend} />
        <DashboardLink
          to=""
          label={formatMessage(messages.TbDProvincialComparison)}
          value={data.TbDProvincialComparison}
        />
        <DashboardLink to="" label={formatMessage(messages.TbDTestingDiagnosis)} value={data.TbDTestingDiagnosis} />
      </DashboardCard>
      <DashboardCard title={formatMessage(messages.mtbRifRrtbDiagnosis)}>
        <DashboardLink to="" label={formatMessage(messages.RRCurrent)} value={data.RRCurrent} />
        <DashboardLink to="" label={formatMessage(messages.RRNationalTrend)} value={data.RRNationalTrend} />
        <DashboardLink
          to=""
          label={formatMessage(messages.RRProvincialComparison)}
          value={data.RRProvincialComparison}
        />
        <DashboardLink to="" label={formatMessage(messages.RRTestingDiagnosis)} value={data.RRTestingDiagnosis} />
      </DashboardCard>
    </Grid>
  )
}

export default MtbRifColumn2
