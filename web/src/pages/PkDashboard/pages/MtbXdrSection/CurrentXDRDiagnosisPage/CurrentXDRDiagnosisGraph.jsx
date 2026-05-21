import React, { useEffect, useRef, useState } from 'react'
import { FormControlLabel, Grid, Switch, Typography } from '@mui/material'
import format from 'date-fns/format'
import reduce from 'lodash/reduce'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import {
  ColumnGraph,
  formatDataByGraphType,
  genLabel,
  LgaSelect,
  Loading,
  negateTimeZoneOffset,
  objectToArray,
  StateSelect,
} from '../../../../../components'
import intlMessages from '../../../../../components/Graphs/graphMessages'
import {
  getMinMaxDateFromMonthString,
  getResultCategoryGroupsForResultList,
} from '../../../../../components/Graphs/graphUtils'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useResultCategoryGroup from '../../../../../hooks/result/useResultCategoryGroup'
import useAuthState from '../../../../../hooks/useAuthState'
import useFilterUpdate from '../../../../../hooks/useFilterUpdate'
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
  { groupBy: 'assay' },
  { resultCategory1: 'Detected' },
  { resultCategory1: 'Trace Detected' },
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

const CurrentXDRDiagnosisPage = () => {
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
  const { data: assays, isLoading: isLoadingAssays } = useAssayList()
  const scopedAssays = assays?.filter(x => x.externalId === 'GxMtbXdr')
  const { data: resultCategoryGroups, isLoading: isLoadingResultCategoryGroups } = useResultCategoryGroup(
    scopedAssays?.map(x => x.id)
  )

  const { data, isLoading } = useQuery(
    ['testPerformedMonthlyPercentage', { endPointParams: objectToArray(filters).concat(defaultFilters) }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/current-result-aggregations', params: endPointParams })
  )

  const [barData, setBarData] = useState({})
  useEffect(() => {
    if (data && assays) {
      const info = data.data.map(r => (r.assay ? r : { ...r, assay: 'GxMtbXdr', assayI18nKey: 'assayGeneXpertMtbXdr' }))
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
              formatMessage(intlMessages[format(negateTimeZoneOffset(new Date(result.month)), 'MMM').toLowerCase()]) +
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
      title={formatMessage(messages.DCurrentPending)}
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
      {isLoading || isLoadingAssays || isLoadingResultCategoryGroups ? (
        <Loading />
      ) : (
        <Grid container sx={{ mt: 2 }}>
          {barData.data && barData.data.length ? (
            <Grid item xs={12} md={8}>
              {user.isCountry('PK') ? undefined : (
                <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
                  {formatMessage(messages.mtbPositivesCurrentYear)}
                </Typography>
              )}

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
                    const assayIds = [assays.find(a => a.externalId === evt.data.data.id).id]
                    const resultCategoryGroupId = getResultCategoryGroupsForResultList(resultCategoryGroups, assayIds, [
                      'Detected',
                      'Trace Detected',
                    ])
                    const params = {
                      ...filterRef.current,
                      countryId: user.countryId,
                      displayResult: 'actual',
                      minDate,
                      maxDate,
                      assayId: assayIds,
                      resultCategoryGroupId,
                    }
                    addFilter({ ...params }, '/browse/result')
                    navigate('/browse/result')
                  })
                }}
              />
            </Grid>
          ) : null}
          <TripleCardSide
            data={[
              { label: formatMessage(messages.xdrTBCasesPerYear), value: `${data.totalResultsCurrentYear}` },
              {
                label: formatMessage(messages.xdrAverageMoth),
                value: `${data.averageTestsPerMonthCurrentYear.toFixed(0)}`,
              },
              { label: formatMessage(messages.xdrTBToday), value: `${data.totalResultsToday}` },
            ]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default CurrentXDRDiagnosisPage
