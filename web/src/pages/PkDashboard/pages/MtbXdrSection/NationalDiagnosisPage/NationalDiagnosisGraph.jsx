import React, { useState, useEffect } from 'react'
import { FormControlLabel, Switch, Grid, Typography } from '@mui/material'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import {
  LgaSelect,
  StateSelect,
  Loading,
  fillYear,
  ColumnGraph,
  LineGraph,
  objectToArray,
} from '../../../../../components'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAuthState from '../../../../../hooks/useAuthState'
import { usePathFilter } from '../../../../../hooks/usePathFilter'
import { getCustomMessage, graphMessages, months } from '../../../../../messages'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'

const maxDate = new Date()

const endpointParams = [
  { groupBy: 'month' },
  { minDate: `${maxDate.getFullYear() - 5}-01-01` },
  { maxDate },
  { assay: 'GxMtbXdr' },
  { resultCategory1: 'Detected' },
]

const NationalDiagnosisGraph = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filters, setFilter] = usePathFilter(undefined)

  const mergedParams = filters ? [...endpointParams, ...objectToArray(filters)] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['tbAllTestsYearlyTrends', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/gx-10c-trends-national', params: mergedParams })
  )

  const [graphData, setGraphData] = useState(false)
  const [annual, setAnnual] = useState(false)
  useEffect(() => {
    if (data) {
      const grouped = data.data
        .map(item => ({ year: item.month.split('-')[0], month: item.month.split('-')[1], value: item.cnt }))
        .sort((a, b) => b.month - a.month || b.year - a.year)
        .reverse()
        .map(item => ({ ...item, month: `${formatMessage(months[item.month - 1])}` }))

      const annualData = []
      grouped.map(item => {
        const year = annualData.find(annual => annual.year === item.year)
        if (year) {
          year.value += item.value
        } else {
          annualData.push({ type: item.year, year: item.year, value: item.value })
        }
        return item
      })
      if (grouped) {
        setGraphData(fillYear(grouped, formatMessage).sort((a, b) => a.year - b.year))
        setAnnual(annualData.sort((a, b) => a.year - b.year))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return isLoading ? (
    <Loading />
  ) : (
    <PkPage
      title={formatMessage(user.isPakistan ? messages.DNationalTrend : messages.nationalMtbDetectionTrends)}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          <StateSelect
            value={filters?.stateId ?? ''}
            countryId={user.countryId}
            onChange={e => setFilter({ stateId: e.target.value })}
            label={getCustomMessage(formatMessage, messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            value={filters?.lgaId ?? ''}
            stateId={filters?.stateId}
            onChange={e => setFilter(prv => ({ ...prv, lgaId: e.target.value }))}
            label={getCustomMessage(formatMessage, messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      <Grid container>
        <Grid item xs={12} md={4}>
          <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
            {formatMessage(messages[user.isCountry('PK') ? 'annualDiagnosedTrends' : 'mtbPlusDetectionTrends'])}
          </Typography>
          <ColumnGraph
            data={annual}
            showLabel={showLabel}
            graphId="tbAllTestsYearlyTrends"
            xField="year"
            yField="value"
            colors="#34717c"
            tooltip={{
              customContent: (_title, _data) => {
                return `
  <div class="g2-tooltip-title">${_title}</div>
  <ul class="g2-tooltip-list" style="margin: 0px; list-style-type: none; padding: 0px;">
  ${_data
    ?.map(
      r => `<li class="g2-tooltip-list-item" data-index="" style="list-style-type: none; padding: 0px; margin: 12px 0px;">
      <span style="background-color:#34717c;" class="g2-tooltip-marker"></span>
    <span class="g2-tooltip-name">${formatMessage(
      messages.annualDiagnosedTrends
    )}</span>: <span class="g2-tooltip-value" style="display: inline-block; float: right; margin-left: 30px;">${
        r.data.value
      }</span>
    </li>`
    )
    .join('')}
  </ul>`
              },
            }}
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
            {formatMessage(messages[user.isCountry('PK') ? 'monthlyDiagnosedTrends' : 'mtbPlusMonthlyDetectionTrends'])}
          </Typography>
          <LineGraph
            data={graphData}
            showLabel={showLabel}
            graphId="tbAllTestsYearlyTrends"
            xField="month"
            yField="value"
            seriesField="year"
          />
        </Grid>
      </Grid>
    </PkPage>
  )
}

export default NationalDiagnosisGraph
