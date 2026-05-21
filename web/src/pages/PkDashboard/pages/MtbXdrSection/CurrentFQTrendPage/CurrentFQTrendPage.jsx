import React, { useState, useEffect } from 'react'
import { FormControlLabel, Grid, Switch, Typography } from '@mui/material'
import format from 'date-fns/format'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import {
  LgaSelect,
  StateSelect,
  negateTimeZoneOffset,
  objectToArray,
  ColumnGraph,
  Loading,
} from '../../../../../components'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAuthState from '../../../../../hooks/useAuthState'
import { usePathFilter } from '../../../../../hooks/usePathFilter'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import PkPage from '../../../components/PkPage'
import TripleCardSide from '../../../components/TripleCardSide'
import messages from '../../../PkDashboard.Messages'

const now = new Date()
/**
 * Do not use below startOfYearUTC and endOfYearUTC, because after datetime preparation
 * for logged-in user in TZ +03:00 and current country in TZ +06:00 the fetch payload
 * will have dates like this
 *   minDate: '2024-01-01T03:00:00.000+06:00',
 *   maxDate: '2025-01-01T02:59:59.999+06:00',
 */
// const startOfYearUTC = new Date(Date.UTC(now.getFullYear()))
// const endOfYearUTC = new Date(Date.UTC(now.getFullYear(), 11, 31, 23, 59, 59, 999))
// const minDate = startOfYearUTC
// const maxDate = endOfYearUTC
/**
 * To resolve such over-engineered date preparation for this report let's use simple
 * way and format to 'yyyy-01-01' and 'yyyy-12-31'.
 * This will produce
 *    minDate: 2024-01-01T00:00:00.000+06:00
 *    maxDate: 2024-12-31T23:59:59.999+06:00
 * for fetching, and on API from this dates we can cut first 10 characters for using in queries
 */
const minDate = format(now, 'yyyy-01-01')
const maxDate = format(now, 'yyyy-12-31')

const defaultFilters = [
  { assay: 'GxMtbXdr' },
  { groupBy: 'month' },
  { resistance: 'FLQ' },
  { minDate },
  { maxDate },
  { flags: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR' },
  { flags: 'GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR' },
  { flags: 'GET_TOTAL_RESULTS_FOR_TODAY' },
]

const CurrentFQTrendPage = () => {
  const { formatMessage, format } = useIntl()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filters, setFilters] = usePathFilter()

  const { data, isLoading } = useQuery(
    ['mtbXdrFqDetected', { endPointParams: objectToArray(filters).concat(defaultFilters) }],
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
            month:
              formatMessage(messages[format(negateTimeZoneOffset(new Date(result.month)), 'MMM').toLowerCase()]) +
              format(negateTimeZoneOffset(new Date(result.month)), '-yyyy'),
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
            value={filters?.stateId ?? ''}
            countryId={user.countryId}
            onChange={e => setFilters({ stateId: e.target.value })}
            label={getCustomMessage(formatMessage, messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            value={filters?.lgaId ?? ''}
            stateId={filters?.stateId}
            onChange={e => setFilters(prv => ({ ...prv, lgaId: e.target.value }))}
            label={getCustomMessage(formatMessage, messages, 'selectPlaceholder', user, { entity: 'lga' })}
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
                value: `${data.averageTestsPerMonthCurrentYear.toFixed(0)}`,
              },
              { label: formatMessage(messages.FQRToday), value: `${data.totalResultsToday}` },
            ]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default CurrentFQTrendPage
