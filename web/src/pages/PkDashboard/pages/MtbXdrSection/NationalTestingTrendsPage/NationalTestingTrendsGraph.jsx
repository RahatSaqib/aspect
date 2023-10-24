import React, { useState, useCallback, useEffect } from 'react'
import { FormControlLabel, Switch, Grid, Typography } from '@mui/material'
import { useQuery } from 'react-query'
import { LgaSelect, StateSelect, Loading, fillYear, objectToArray, LineGraph } from '../../../../../cleanComponents'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage, graphMessages, months } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
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
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter, setFilter] = useState({})

  const onChangeState = useCallback(e => setFilter({ stateId: e.target.value }), [])
  const onChangeLga = useCallback(e => setFilter(prev => ({ ...prev, lgaId: e.target.value })), [])

  const mergedParams = filter ? [...endpointParams, ...objectToArray(filter)] : [...endpointParams]

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
        setGraphData(fillYear(grouped))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return isLoading ? (
    <Loading />
  ) : (
    <PkPage
      title={formatMessage(messages.nationalXdrTestingTrends)}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          <StateSelect
            value={filter.stateId ?? ''}
            countryId={user.countryId}
            onChange={onChangeState}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            value={filter.lgaId ?? ''}
            stateId={filter.stateId}
            onChange={onChangeLga}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      <Grid container>
        <Grid item xs={12}>
          <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
            {formatMessage(messages.monthlyTestingTrends)}
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
