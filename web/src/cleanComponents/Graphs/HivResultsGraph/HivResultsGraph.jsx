import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import classnames from 'classnames/bind'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import filter from 'lodash/filter'
import reduce from 'lodash/reduce'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { formatDataByGraphType } from '../../../components/Graphs/Helpers/Formatters'
import messages from '../../../components/Graphs/intlMessages'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import useI18n from '../../../hooks/useI18n'
import { graphMessages } from '../../../messages'
import { useFilterUpdate } from '../../../providers/FilterProvider'
import ErrorBoundary from '../../ErrorBoundary'
import Loading from '../../Loading'
import styles from '../graphStyles.css'
import {
  getTimePeriod,
  genLabel,
  calcPercentageForGraphs,
  getAverageFromData,
  flattenAssaysStructure,
  negateTimeZoneOffset,
} from '../graphUtils'
import { DonutGraph, BarGraph } from '../index'

const cssClasses = classnames.bind(styles)

const endPointParams = [
  { assay: 'GxHiv1Vl' },
  { groupBy: 'month' },
  { groupBy: 'resultCategory1' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
  { flags: 'GET_TOTAL_RESULTS' },
]

const HivResultsGraph = ({ assaysFromState: assays }) => {
  const { formatMessage, format } = useI18n()
  const [showLabel, setShowLabel] = useState(false)
  const navigate = useNavigate()
  const [addFilter] = useFilterUpdate()

  const { data, isLoading } = useQuery(
    ['hivByCategory1Monthly', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/clinical-indicator-aggregations', params: endPointParams })
  )

  // code for donut
  const [donutData, setDonutData] = useState({})
  const [barData, setBarData] = useState({})
  useEffect(() => {
    if (data && data.data) {
      const info = data.data
      const i18nKeys = reduce(
        data,
        (acc, curr) => {
          acc[curr.resultCategory1] = curr.resultCategory1I18nKey
          return acc
        },
        {}
      )
      const pieData = formatDataByGraphType(
        info,
        'percentage',
        false,
        'MMM yy',
        'cnt',
        'resultCategory1',
        i18nKeys,
        'pie',
        endPointParams,
        formatMessage,
        messages
      )
      const pieTotal = pieData.reduce((acc, curr) => acc + curr.value, 0)
      const { avg: pieAvg } = getAverageFromData(
        pieData,
        'value',
        ['LessThan40', 'LessThan1000', 'NotDetected'],
        'standard'
      )
      const parsedData = pieData.map(d => ({
        ...d,
        label: genLabel(d.id, assays, formatMessage, messages, i18nKeys),
        value: pieTotal < 1 ? pieTotal : +calcPercentageForGraphs(d.value, pieTotal, 2),
      }))
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
        messages
      )
      const expandedBarData = []
      groupedForBar.map(result => {
        const allKeysButMonth = Object.keys(result).filter(key => key !== 'month' && key !== 'totalCnt')
        allKeysButMonth.map(key =>
          expandedBarData.push({
            id: key,
            month: format(negateTimeZoneOffset(new Date(result.month)), 'MMM-yyyy'),
            value: +result[key].toFixed(3).slice(0, -1),
            type: genLabel(key, assays, formatMessage, messages, i18nKeys),
            originalMonth: result.month,
          })
        )
        return result
      })
      setBarData({ data: expandedBarData })
      setDonutData({ data: parsedData, total: `${pieAvg}%` })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filter])

  return isLoading ? (
    <Loading />
  ) : (
    <ErrorBoundary>
      <Grid container className={cssClasses('Graph_Container')}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title={formatMessage(graphMessages.clinicalIndicatorsVLTitle)} />
            <CardContent>
              <Grid container spacing={1} className={cssClasses('Graph_Content')}>
                <Grid item xs={12} md={12} lg={2}>
                  <Grid container spacing={2} className={cssClasses('Graph_Content_Container')}>
                    <Grid item xs={12} md={4} lg={12} className={cssClasses('Graph_Content_ShowLabel')}>
                      <FormControlLabel
                        label={formatMessage(graphMessages.showValuesLabel)}
                        control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} md={12} lg={10}>
                  <Grid container>
                    {barData.data && barData.data.length ? (
                      <Grid item xs={12} md={8}>
                        <BarGraph
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
                                assayId: assays.filter(it => ['GxHiv1Vl'].includes(it.externalId)).map(it => it.id),
                                maxDate: format(endOfMonth(parsedDate), base),
                                minDate: format(startOfMonth(parsedDate), base),
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
                    {donutData.data && donutData.data.length ? (
                      <Grid item xs={12} md={4} lg={4}>
                        <DonutGraph
                          data={donutData.data}
                          total={donutData.total}
                          graphId="hivByCategory1Aggregate"
                          graphTitle={[
                            formatMessage(graphMessages.clinicalIndicatorsPieLegend)
                              .split(' ')
                              .splice(
                                0,
                                Math.ceil(
                                  formatMessage(graphMessages.clinicalIndicatorsPieLegend).split(' ').length / 2
                                )
                              )
                              .join(' '),
                            formatMessage(graphMessages.clinicalIndicatorsPieLegend)
                              .split(' ')
                              .splice(
                                Math.ceil(
                                  formatMessage(graphMessages.clinicalIndicatorsPieLegend).split(' ').length / 2
                                )
                              )
                              .join(' '),
                          ].join('<br/>')} // "Average Monthly<br/>Test Performed"
                          legend={false}
                          showLabel={showLabel}
                        />
                      </Grid>
                    ) : null}
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ErrorBoundary>
  )
}

export default HivResultsGraph
