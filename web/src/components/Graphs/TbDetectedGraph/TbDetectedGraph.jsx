import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import filter from 'lodash/filter'
import reduce from 'lodash/reduce'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import { graphMessages } from '../../../messages'
import { GRAPHS_QUERY_OPTIONS } from '../../../utils/consts/ReactQuery/CONSTS'
import { formatDataByGraphType, Loading } from '../../index'
import fetchWrapperForQueries from '../../QueryFetch'
import messages from '../graphMessages'
import styles from '../graphStyles.module.css'
import {
  getTimePeriod,
  genLabel,
  calcPercentageForGraphs,
  negateTimeZoneOffset,
  getMinMaxDateFromMonthString,
  getResultCategoryGroupsForResultList,
} from '../graphUtils'
import { DonutGraph, ColumnGraph } from '../index'

const endPointParams = [
  { assay: 'GxMtbRif' },
  { assay: 'GxMtbRifUltra' },
  { groupBy: 'month' },
  { groupBy: 'resultCategory1' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(1, 'months', 'yyyy-MM-dd', true) },
  { flags: 'GET_TOTAL_RESULTS' },
]

const TbDetectedGraph = ({ assaysFromState: assays, resultCategoryGroupsFromState: resultCategoryGroups }) => {
  const { formatMessage, format } = useIntl()
  const [showLabel, setShowLabel] = useState(false)
  const navigate = useNavigate()
  const [addFilter] = useFilterUpdate()
  const { data } = useQuery(
    ['tbResultsByCategory1Monthly', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/clinical-indicator-aggregations', params: endPointParams }),
    { ...GRAPHS_QUERY_OPTIONS }
  )

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
      // code for donut
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

      const detected = pieData.filter(elem => elem.id === 'Detected' || elem.id === 'Trace Detected')
      const totalDetected = detected.reduce((sum, elem) => sum + elem.value, 0)
      const totalValidResults = pieData.reduce((sum, elem) => sum + elem.value, 0)
      const pieAvg = ((totalDetected / totalValidResults) * 100).toFixed(1)

      const pie = pieData.map(d => ({
        ...d,
        label: genLabel(d.id, assays, formatMessage, messages, i18nKeys),
        value: pieTotal < 1 ? pieTotal : +calcPercentageForGraphs(d.value, pieTotal, 1),
      }))
      // code for column
      const groupedForBar = formatDataByGraphType(
        info,
        'percentage',
        {},
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
            month:
              formatMessage(messages[format(negateTimeZoneOffset(new Date(result.month)), 'MMM').toLowerCase()]) +
              format(negateTimeZoneOffset(new Date(result.month)), '-yyyy'),
            value: +result[key].toFixed(1),
            type: genLabel(key, assays, formatMessage, messages, i18nKeys),
            originalMonth: result.month,
          })
        )
        return result
      })
      setBarData({ data: expandedBarData })
      setDonutData({ data: pie, total: `${pieAvg}%` })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filter])

  return !data || !assays || !resultCategoryGroups ? (
    <Loading />
  ) : (
    <Grid container className={styles.Graph_Container}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={formatMessage(graphMessages.mtbDetection)} />
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
                        graphId="tbResultsByCategory1Monthly"
                        xField="month"
                        yField="value"
                        seriesField="type"
                        showLabel={showLabel}
                        isPercentage
                        onReady={plot => {
                          plot.on('plot:click', evt => {
                            const assayIds = assays
                              .filter(it => ['GxMtbRif', 'GxMtbRifUltra'].includes(it.externalId))
                              .map(it => it.id)
                            const resultCategoryGroupId = getResultCategoryGroupsForResultList(
                              resultCategoryGroups,
                              assayIds,
                              [evt.data.data.id]
                            )
                            const { minDate, maxDate } = getMinMaxDateFromMonthString(evt.data.data.originalMonth)
                            const params = {
                              displayResult: 'actual',
                              assayId: assayIds,
                              minDate,
                              maxDate,
                              resultCategoryGroupId,
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
                        graphId="tbResultsByCategory1Aggregate"
                        graphTitle={[
                          formatMessage(graphMessages.clinicalIndicatorsTBDetectedPie)
                            .split(' ')
                            .splice(
                              0,
                              Math.ceil(
                                formatMessage(graphMessages.clinicalIndicatorsTBDetectedPie).split(' ').length / 2
                              )
                            )
                            .join(' '),
                          formatMessage(graphMessages.clinicalIndicatorsTBDetectedPie)
                            .split(' ')
                            .splice(
                              Math.ceil(
                                formatMessage(graphMessages.clinicalIndicatorsTBDetectedPie).split(' ').length / 2
                              )
                            )
                            .join(' '),
                        ].join('<br/>')} // "Average Monthly<br/>Test Performed"
                        showLabel={showLabel}
                        legend={false}
                      />
                    </Grid>
                  ) : (
                    <Loading />
                  )}
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default TbDetectedGraph
