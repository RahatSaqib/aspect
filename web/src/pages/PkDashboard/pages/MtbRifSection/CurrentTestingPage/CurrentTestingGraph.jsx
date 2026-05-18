import React, { useState, useEffect, useRef } from 'react'
import { FormControlLabel, Grid, Switch, Typography } from '@mui/material'
import format from 'date-fns/format'
import reduce from 'lodash/reduce'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import {
  LgaSelect,
  StateSelect,
  genLabel,
  // getTimePeriod,
  negateTimeZoneOffset,
  objectToArray,
  ColumnGraph,
  Loading,
  formatDataByGraphType,
} from '../../../../../components'
import intlMessages from '../../../../../components/Graphs/graphMessages'
import { getMinMaxDateFromMonthString } from '../../../../../components/Graphs/graphUtils'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useAuthState from '../../../../../hooks/useAuthState'
import useFilterUpdate from '../../../../../hooks/useFilterUpdate'
import { usePathFilter } from '../../../../../hooks/usePathFilter'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import PkPage from '../../../components/PkPage'
import TripleCardSide from '../../../components/TripleCardSide'
import messages from '../../../PkDashboard.Messages'

/**
 * ------------------------
 * NOTE:
 * ------------------------
 * We fetch data via web/src/components/QueryFetch/index.js and then helper func
 * buildEndpointAndQueryString() calls checkIfParamsIsDate() and getISOFromString() in
 * web/src/components/shared/DateTimeInput/utils/date.js
 * where we add to the ISO datetime a current country timezone from localStorage.
 * In which case, when logged in user is in TZ +03:00 but country is in TZ +06:00,
 * then produced time would be like '2024-01-01T03:00:00.000+06:00'.
 * In this case it is impossible in API to correctly transform time to GMT to know
 * for sure what exactly time was meant by the user.
 * To resolve such over-engineered datetime preparation - for this report let's use
 * simple way and format `now` to 'yyyy-01-01' and 'yyyy-12-31' which at the end will produce
 *    minDate: 2024-01-01T00:00:00.000+06:00
 *    maxDate: 2024-12-31T23:59:59.999+06:00
 * and from this dates (on API) we can cut first 10 characters for using in knex queries.
 */

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
  { assay: 'GxMtbRif' },
  { assay: 'GxMtbRifUltra' },
  { groupBy: 'month' },
  { groupBy: 'assay' },
  { minDate },
  { maxDate },
  /**
   * we may use below range when now is January, let's leave it here
   * `getTimePeriod` is in `/components/Graphs/graphUtils`
   */
  // { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  // { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
  { flags: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR' },
  { flags: 'GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR' },
  { flags: 'GET_TOTAL_RESULTS_FOR_TODAY' },
]

const RifCurrentGraphPage = () => {
  const { formatMessage, format } = useIntl()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filters, setFilter] = usePathFilter()
  const [addFilter] = useFilterUpdate()
  const navigate = useNavigate()
  const filterRef = useRef()

  useEffect(() => {
    filterRef.current = filters
  }, [filters])
  const { data: assays } = useAssayList()

  const { data, isLoading } = useQuery(
    ['testPerformedMonthlyPercentage', { endPointParams: objectToArray(filters ?? {}).concat(defaultFilters) }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/current-result-aggregations', params: endPointParams })
  )

  const [barData, setBarData] = useState({})
  useEffect(() => {
    if (data && assays) {
      const info = data.data.map(r => (r.assay ? r : { ...r, assay: 'GxMtbRif', assayI18nKey: 'assayGeneXpertMtbRif' }))

      const i18nKeys = reduce(
        info,
        (acc, curr) => {
          acc[curr.assay] = curr.assayI18nKey
          return acc
        },
        {}
      )
      const groupedForBar = formatDataByGraphType(
        info,
        'actual',
        false,
        'MMM',
        'month',
        'assay',
        i18nKeys,
        'bar',
        undefined,
        formatMessage,
        intlMessages
      )
      const expandedBarData = []
      groupedForBar.map(result => {
        const allKeysButMonth = Object.keys(result).filter(key => key !== 'month')
        allKeysButMonth.map(key =>
          expandedBarData.push({
            id: key,
            month:
              formatMessage(messages[format(negateTimeZoneOffset(new Date(result.month)), 'MMM').toLowerCase()]) +
              format(negateTimeZoneOffset(new Date(result.month)), '-yyyy'),
            value: +result[key].toFixed(3).slice(0, -1),
            type: genLabel(key, assays, formatMessage, intlMessages, i18nKeys),
            originalMonth: result.month,
          })
        )
        return result
      })

      setBarData({ data: expandedBarData })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, assays])

  return (
    <PkPage
      title={formatMessage(messages.CurrentTBTesting)}
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
      {isLoading ? (
        <Loading />
      ) : (
        <Grid container sx={{ mt: 2 }}>
          {barData.data && barData.data.length ? (
            <Grid item xs={12} md={8}>
              <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
                {formatMessage(messages.testsPerformedYear)}
              </Typography>
              <ColumnGraph
                data={barData.data}
                graphId="testPerformedMonthlyPercentage"
                xField="month"
                yField="value"
                seriesField="type"
                showLabel={showLabel}
                onReady={plot => {
                  plot.on('plot:click', evt => {
                    const { minDate, maxDate } = getMinMaxDateFromMonthString(evt.data.data.originalMonth)

                    const baseUrl = '/browse/result'
                    addFilter(
                      {
                        ...filterRef.current,
                        countryId: user.countryId,
                        displayResult: 'actual',
                        minDate,
                        maxDate,
                        assayId: assays.find(a => a.externalId === evt.data.data.id).id,
                      },
                      baseUrl
                    )
                    navigate(baseUrl)
                  })
                }}
              />
            </Grid>
          ) : null}
          <TripleCardSide
            data={[
              { label: formatMessage(messages.testPerYear), value: `${data.totalResultsCurrentYear}` },
              {
                label: formatMessage(messages.testPerMonth),
                value: `${data.averageTestsPerMonthCurrentYear.toFixed(0)}`,
              },
              { label: formatMessage(messages.testToday), value: `${data.totalResultsToday}` },
            ]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default RifCurrentGraphPage
