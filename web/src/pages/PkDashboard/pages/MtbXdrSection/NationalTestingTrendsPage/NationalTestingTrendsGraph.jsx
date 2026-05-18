import React, { useState, useEffect } from 'react'
import { FormControlLabel, Switch, Grid, Typography } from '@mui/material'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { LgaSelect, StateSelect, Loading, fillYear, objectToArray, LineGraph } from '../../../../../components'
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
]

const NationalTestingTrendsGraph = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filters, setFilter] = usePathFilter()

  const mergedParams = filters ? [...endpointParams, ...objectToArray(filters)] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['tbAllTestsYearlyTrends', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/gx-10c-trends-national', params: mergedParams })
  )

  const [graphData, setGraphData] = useState(false)
  useEffect(() => {
    if (data) {
      const grouped = data.data
        .map(item => ({ year: item.month.split('-')[0], month: item.month.split('-')[1], value: item.cnt }))
        .sort((a, b) => b.month - a.month || b.year - a.year)
        .reverse()
        .map(item => ({ ...item, month: `${formatMessage(months[item.month - 1])}` }))

      if (grouped) {
        setGraphData(fillYear(grouped, formatMessage).sort((a, b) => a.year - b.year))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return isLoading ? (
    <Loading />
  ) : (
    <PkPage
      title={formatMessage(user.isPakistan ? messages.TNationalTrend : messages.nationalMtbXdrTestingTrends)}
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
            onChange={e => setFilter(prev => ({ ...prev, lgaId: e.target.value }))}
            label={getCustomMessage(formatMessage, messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      <Grid container>
        <Grid item xs={12}>
          <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
            {formatMessage(messages[user.isCountry('PK') ? 'monthlyTestingTrends' : 'monthlyXDRTrends'])}
          </Typography>
          {graphData ? (
            <LineGraph
              data={graphData}
              showLabel={showLabel}
              graphId="tbAllTestsYearlyTrends"
              xField="month"
              yField="value"
              seriesField="year"
            />
          ) : null}
        </Grid>
      </Grid>
    </PkPage>
  )
}

export default NationalTestingTrendsGraph
