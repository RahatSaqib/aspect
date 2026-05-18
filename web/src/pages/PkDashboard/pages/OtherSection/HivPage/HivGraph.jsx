import React, { useState, useEffect } from 'react'
import { Switch, FormControlLabel, Grid, Typography } from '@mui/material'
import endOfMonth from 'date-fns/endOfMonth'
import endOfYear from 'date-fns/endOfYear'
import startOfMonth from 'date-fns/startOfMonth'
import startOfYear from 'date-fns/startOfYear'
import reduce from 'lodash/reduce'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import {
  ColumnGraph,
  negateTimeZoneOffset,
  flattenAssaysStructure,
  Loading,
  formatDataByGraphType,
} from '../../../../../components'
import intlMessages from '../../../../../components/Graphs/graphMessages'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useFilterUpdate from '../../../../../hooks/useFilterUpdate'
import { graphMessages } from '../../../../../messages'
import PkPage from '../../../components/PkPage'
import TripleCardSide from '../../../components/TripleCardSide'
import pkMessages from '../../../PkDashboard.Messages'

const endPointParams = [
  { assay: 'GxHiv1Vl' },
  { assay: 'GxHiv1Qual' },
  { groupBy: 'month' },
  { groupBy: 'resultCategory1' },
  { minDate: startOfYear(new Date()) },
  { maxDate: endOfYear(new Date()) },
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

const HivGraphPage = () => {
  const { formatMessage, format } = useIntl()
  const [showLabel, setShowLabel] = useState(true)
  const navigate = useNavigate()
  const [addFilter] = useFilterUpdate()

  const { data: assays } = useAssayList()

  const { data, isLoading } = useQuery(
    ['hivByCategory1Monthly', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/current-result-aggregations', params: endPointParams })
  )

  const [barData, setBarData] = useState({})
  useEffect(() => {
    if (data && data.data && assays) {
      const info = data.data
      const i18nKeys = reduce(
        data,
        (acc, curr) => {
          acc[curr.resultCategory1] = curr.resultCategory1I18nKey
          return acc
        },
        {}
      )

      // code for column
      const groupedForBar = formatDataByGraphType(
        info,
        'percentage',
        false,
        'MMM',
        'month',
        'resultCategory1',
        i18nKeys,
        'bar',
        endPointParams,
        formatMessage,
        intlMessages
      )
      const expandedBarData = []
      groupedForBar.map(result => {
        const allKeysButMonth = Object.keys(result).filter(key => key !== 'month' && key !== 'totalCnt')
        allKeysButMonth.map(key =>
          expandedBarData.push({
            id: key,
            month:
              formatMessage(intlMessages[format(negateTimeZoneOffset(new Date(result.month)), 'MMM').toLowerCase()]) +
              format(negateTimeZoneOffset(new Date(result.month)), '-yyyy'),
            value: +result[key].toFixed(3).slice(0, -1) || 0,
            type: key === 'undefined' ? 'NO DATA' : formatMessage(intlMessages[`resultCategory${key}`]),
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
      title={formatMessage(pkMessages.peopleTestedHiv)}
      filters={
        <FormControlLabel
          sx={{ minWidth: '145px' }}
          label={formatMessage(graphMessages.showValuesLabel)}
          control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
        />
      }
    >
      {isLoading ? (
        <Loading />
      ) : (
        <Grid container sx={{ mt: 2 }}>
          {barData.data && barData.data.length ? (
            <Grid item xs={12} md={8}>
              <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
                {formatMessage(pkMessages.testsPerformedYear)}
              </Typography>
              <ColumnGraph
                data={barData.data}
                graphId="hivByCategory1Monthly"
                xField="month"
                yField="value"
                seriesField="type"
                showLabel={showLabel}
                isPercentage
                onReady={plot => {
                  plot.on('plot:click', evt => {
                    const base = 'yyyy-MM-dd'
                    const parsedDate = negateTimeZoneOffset(new Date(evt.data.data.originalMonth), base)

                    const params = {
                      displayResult: 'actual',
                      assayId: assays.filter(it => ['GxHiv1Vl'].includes(it.externalId)).map(it => it.id),
                      minDate: format(startOfMonth(parsedDate), base),
                      maxDate: format(endOfMonth(parsedDate), base),
                      resultCategoryId: flattenAssaysStructure({ data: assays }).filter(
                        a => a.externalId === evt.data.data.id
                      )[0].id,
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
              { label: formatMessage(pkMessages.testPerYear), value: `${data.totalResultsCurrentYear}` },
              {
                label: formatMessage(pkMessages.testPerMonth),
                value: `${data.averageTestsPerMonthCurrentYear.toFixed(0)}`,
              },
              { label: formatMessage(pkMessages.testToday), value: `${data.totalResultsToday}` },
            ]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default HivGraphPage
