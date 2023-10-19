import React, { useState, useEffect } from 'react'
import { Switch, FormControlLabel, Grid, Typography } from '@mui/material'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import reduce from 'lodash/reduce'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router'
import {
  LgaSelect,
  StateSelect,
  genLabel,
  negateTimeZoneOffset,
  objectToArray,
  ColumnGraph,
  Loading,
  formatDataByGraphType,
} from '../../../../../cleanComponents'
import intlMessages from '../../../../../cleanComponents/Graphs/graphMessages'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import { useFilterUpdate } from '../../../../../providers/FilterProvider'
import PkPage from '../../../components/PkPage'
import TripleCardSide from '../../../components/TripleCardSide'
import messages from '../../../PkDashboard.Messages'

const now = new Date()
const startOfYearUTC = new Date(Date.UTC(now.getFullYear()))
const endOfYearUTC = new Date(Date.UTC(now.getFullYear(), 11, 31, 23, 59, 59, 999))

const defaultFilters = [
  { assay: 'assayGXCovid19' },
  { assay: 'assayGenericCovid19' },
  { groupBy: 'month' },
  { groupBy: 'assay' },
  { minDate: startOfYearUTC },
  { maxDate: endOfYearUTC },
  /**
   * we may use below range when now is January, let's leave it here
   * `getTimePeriod` is in `/cleanComponents/Graphs/graphUtils`
   */
  // { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  // { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
  { flags: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR' },
  { flags: 'GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR' },
  { flags: 'GET_TOTAL_RESULTS_IN_LAST_24_HOURS' },
]

const CovidGraphPage = () => {
  const { formatMessage, format } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter, setFilter] = useState()
  const { data: assays } = useAssayList()
  const navigate = useNavigate()
  const [addFilter] = useFilterUpdate()

  const { data, isLoading } = useQuery(
    ['covidByCategory1Monthly', { endPointParams: objectToArray(filter ?? {}).concat(defaultFilters) }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/current-result-aggregations', params: endPointParams })
  )

  const [barData, setBarData] = useState({})
  useEffect(() => {
    if (data && assays) {
      const info = data.data.map(r => (r.assay ? r : { ...r, assay: 'assayGXCovid19', assayI18nKey: 'assayGXCovid19' }))
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
        messages
      )

      const expandedBarData = []
      groupedForBar.map(result => {
        const allKeysButMonth = Object.keys(result).filter(key => key !== 'month')
        allKeysButMonth.map(key =>
          expandedBarData.push({
            id: key,
            month: format(negateTimeZoneOffset(new Date(result.month)), 'MMM-yyyy'),
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
      title={formatMessage(messages.peopleTestedCovid)}
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
                    const base = 'yyyy-MM-dd'
                    const parsedDate = negateTimeZoneOffset(new Date(evt.data.data.originalMonth), base)

                    addFilter(
                      {
                        displayResult: 'actual',
                        maxDate: format(endOfMonth(parsedDate), base),
                        minDate: format(startOfMonth(parsedDate), base),
                        onlyReportableResults: true,
                        assayId: assays.find(a => a.externalId === evt.data.data.id).id,
                      },
                      '/browse/result'
                    )
                    navigate('/browse/result')
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
                value: `${data.averageTestsPerMonthCurrentYear.toFixed(1)}`,
              },
              { label: formatMessage(messages.testPerDay), value: `${data.totalResultsInLast24Hours}` },
            ]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default CovidGraphPage
