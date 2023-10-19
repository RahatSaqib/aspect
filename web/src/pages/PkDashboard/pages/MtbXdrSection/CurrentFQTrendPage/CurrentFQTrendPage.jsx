import React, { useState, useEffect } from 'react'
import { FormControlLabel, Grid, Switch, Typography } from '@mui/material'
import { useQuery } from 'react-query'
import {
  LgaSelect,
  StateSelect,
  negateTimeZoneOffset,
  objectToArray,
  ColumnGraph,
  Loading,
} from '../../../../../cleanComponents'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import PkPage from '../../../components/PkPage'
import TripleCardSide from '../../../components/TripleCardSide'
import messages from '../../../PkDashboard.Messages'

const now = new Date()
const startOfYearUTC = new Date(Date.UTC(now.getFullYear()))
const endOfYearUTC = new Date(Date.UTC(now.getFullYear(), 11, 31, 23, 59, 59, 999))

const defaultFilters = [
  { assay: 'GxMtbXdr' },
  { groupBy: 'month' },
  { resistance: 'FLQ' },
  { minDate: startOfYearUTC },
  { maxDate: endOfYearUTC },
  { flags: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR' },
  { flags: 'GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR' },
  { flags: 'GET_TOTAL_RESULTS_IN_LAST_24_HOURS' },
]

const CurrentFQTrendPage = () => {
  const { formatMessage, format } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter, setFilter] = useState({})

  const { data, isLoading } = useQuery(
    ['mtbXdrFqDetected', { endPointParams: objectToArray(filter).concat(defaultFilters) }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/current-result-aggregations', params: endPointParams })
  )

  const [barData, setBarData] = useState({})
  useEffect(() => {
    if (data) {
      const expandedBarData = []
      data.data.map(result => {
        const allKeysButMonth = Object.keys(result).filter(key => key !== 'month')
        allKeysButMonth.map(key =>
          expandedBarData.push({
            id: key,
            month: format(negateTimeZoneOffset(new Date(result.month)), 'MMM-yyyy'),
            value: +result[key].toFixed(3).slice(0, -1),
            type: 'FQ Detected',
            originalMonth: result.month,
          })
        )
        return result
      })

      setBarData({ data: expandedBarData })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <PkPage
      title={formatMessage(messages.currentFQDetection)}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          <StateSelect
            value={filter?.stateId ?? ''}
            countryId={user.countryId}
            onChange={e => setFilter({ stateId: e.target.value })}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            value={filter?.lgaId ?? ''}
            stateId={filter?.stateId}
            onChange={e => setFilter(prv => ({ ...prv, lgaId: e.target.value }))}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      {isLoading ? (
        <Loading />
      ) : (
        <Grid container sx={{ mt: 2 }}>
          <Grid item xs={12} md={8} lg={8}>
            <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
              {formatMessage(messages.FQRCurrentYear)}
            </Typography>
            {barData.data && barData.data.length ? (
              <ColumnGraph
                data={barData.data}
                graphId="testPerformedMonthlyPercentage"
                xField="month"
                yField="value"
                seriesField="type"
                showLabel={showLabel}
                colors="#34717c"
              />
            ) : null}
          </Grid>
          <TripleCardSide
            data={[
              { label: formatMessage(messages.FQRPerYear), value: `${data.totalResultsCurrentYear}` },
              {
                label: formatMessage(messages.FQRPerMonth),
                value: `${data.averageTestsPerMonthCurrentYear.toFixed(1)}`,
              },
              { label: formatMessage(messages.FQRPerDay), value: `${data.totalResultsInLast24Hours}` },
            ]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default CurrentFQTrendPage
