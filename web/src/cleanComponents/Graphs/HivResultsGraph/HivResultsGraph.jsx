import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, FormControlLabel, Grid, Switch } from '@mui/material'
import filter from 'lodash/filter'
import reduce from 'lodash/reduce'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import { graphMessages } from '../../../messages'
import { formatDataByGraphType, Loading } from '../../index'
import messages from '../graphMessages'
import styles from '../graphStyles.module.css'
import {
  calcPercentageForGraphs,
  flattenAssaysStructure,
  genLabel,
  getAverageFromData,
  getTimePeriod,
  negateTimeZoneOffset,
  getMinMaxDateFromMonthString,
} from '../graphUtils'
import { ColumnGraph, DonutGraph } from '../index'

const endPointParams = [
  { assay: 'GxHiv1Vl' },
  { groupBy: 'month' },
  { groupBy: 'resultCategory1' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
  { flags: 'GET_TOTAL_RESULTS' },
]

const HivResultsGraph = ({ assaysFromState: assays }) => {
  const { formatMessage, format } = useIntl()
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
        info,
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
    <Grid container className={styles.Graph_Container}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={formatMessage(graphMessages.clinicalIndicatorsVLTitle)} />
          <CardContent>
            <Grid container spacing={1} className={styles.Graph_Content}>
              <Grid item xs={12} md={12} lg={2}>
                <Grid container spacing={2} className={styles.Graph_Content_Container}>
                  <Grid item xs={12} md={4} lg={12} className={styles.Graph_Content_ShowLabel}>
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
                            const { minDate, maxDate } = getMinMaxDateFromMonthString(evt.data.data.originalMonth)

                            const params = {
                              assayId: assays.filter(it => ['GxHiv1Vl'].includes(it.externalId)).map(it => it.id),
                              minDate,
                              maxDate,
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
                              Math.ceil(formatMessage(graphMessages.clinicalIndicatorsPieLegend).split(' ').length / 2)
                            )
                            .join(' '),
                          formatMessage(graphMessages.clinicalIndicatorsPieLegend)
                            .split(' ')
                            .splice(
                              Math.ceil(formatMessage(graphMessages.clinicalIndicatorsPieLegend).split(' ').length / 2)
                            )
                            .join(' '),
                        ].join('<br/>')} // "Average Monthly<br/>Test Performed"
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
  )
}

export default HivResultsGraph
