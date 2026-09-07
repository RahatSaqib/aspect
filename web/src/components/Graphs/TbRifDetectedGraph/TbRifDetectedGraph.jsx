import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import reduce from 'lodash/reduce'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import { graphMessages } from '../../../messages'
import { GRAPHS_QUERY_OPTIONS } from '../../../utils/consts/ReactQuery/CONSTS'
import { formatDataByGraphType, Loading, LoadingCard } from '../../index'
import fetchWrapperForQueries from '../../QueryFetch'
import messages from '../graphMessages'
import styles from '../graphStyles.module.css'
import {
  getMinMaxDateFromMonthString,
  getTimePeriod,
  genLabel,
  calcPercentageForGraphs,
  formatCompactNumber,
  negateTimeZoneOffset,
  getResultCategoryGroupsForResultList,
} from '../graphUtils'
import { DonutGraph, ColumnGraph } from '../index'

const endPointParams = [
  { assay: 'GxMtbRif' },
  { assay: 'GxMtbRifUltra' },
  { groupBy: 'month' },
  { groupBy: 'resultCategory2' },
  { groupBy: 'resultCategory1' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(1, 'months', 'yyyy-MM-dd', true) },
  { flags: 'GET_TOTAL_RESULTS' },
]

const resultCategoryGroupIds = [
  'GxMtbRifMtbDetectedRifNotDetected',
  'GxMtbRifUltraMtbDetectedRifNotDetected',
  'GxMtbRifMtbDetectedRifDetected',
  'GxMtbRifUltraMtbDetectedRifDetected',
  'GxMtbRifMtbDetectedRifIndeterminate',
  'GxMtbRifUltraMtbDetectedRifIndeterminate',
  'GxMtbRifUltraMTBTraceDetectedRifIndeterminate',
]

for (const resultCategoryGroupId of resultCategoryGroupIds) {
  endPointParams.push({ resultCategoryGroupId })
}

const TbRifDetectedGraph = ({ assaysFromState: assays, resultCategoryGroupsFromState: resultCategoryGroups }) => {
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

  const { donutData, barData } = useMemo(() => {
    if (!data?.data) return { donutData: {}, barData: {} }

    const info = data.data
    const i18nKeys = reduce(
      info,
      (acc, curr) => {
        acc[curr.resultCategory2] = curr.resultCategory2I18nKey
        return acc
      },
      {}
    )

    // code for donut
    const pieData = formatDataByGraphType(
      info,
      'percentage',
      { resultCategory1: { values: ['Detected'] } },
      'MMM yy',
      'cnt',
      'resultCategory2',
      i18nKeys,
      'pie',
      endPointParams,
      formatMessage,
      messages
    )
    const pieTotal = pieData.reduce((acc, curr) => acc + curr.value, 0)
    const detected = pieData.find(elem => elem.id === 'Detected') || {}

    const pieAvg = ((detected.value / pieTotal) * 100).toFixed(1)

    const pie = pieData.map(d => ({
      ...d,
      count: d.value,
      label: genLabel(d.id, assays, formatMessage, messages, i18nKeys),
      value: pieTotal < 1 ? pieTotal : +calcPercentageForGraphs(d.value, pieTotal, 1),
    }))
    // code for columns
    const groupedForBar = formatDataByGraphType(
      info,
      'percentage',
      { resultCategory1: { values: ['Detected'] } },
      'MMM',
      'month',
      'resultCategory2',
      i18nKeys,
      'bar',
      endPointParams,
      formatMessage,
      messages
    )
    const groupedForBarActual = formatDataByGraphType(
      info,
      'actual',
      { resultCategory1: { values: ['Detected'] } },
      'MMM',
      'month',
      'resultCategory2',
      i18nKeys,
      'bar',
      endPointParams,
      formatMessage,
      messages
    )
    const actualCountsByMonth = reduce(
      groupedForBarActual,
      (acc, row) => {
        acc[row.month] = row
        return acc
      },
      {}
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
          count: actualCountsByMonth[result.month]?.[key] ?? 0,
          type: genLabel(key, assays, formatMessage, messages, i18nKeys),
          originalMonth: result.month,
        })
      )
      return result
    })
    const totalText = `${pieAvg}%<br/><span style="font-size:14px;font-weight:400;">${formatCompactNumber(
      detected.value || 0
    )} / ${formatCompactNumber(pieTotal)}</span>`
    return { donutData: { data: pie, total: totalText }, barData: { data: expandedBarData } }
  }, [data, assays, format, formatMessage])

  return !data || !assays || !resultCategoryGroups ? (
    <LoadingCard />
  ) : (
    <Grid container className={styles.Graph_Container}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={formatMessage(graphMessages.mtbRifResistance)} />
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
                        graphId="tbByCategory1Monthly"
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
                              [],
                              [evt.data.data.id]
                            )
                            const { minDate, maxDate } = getMinMaxDateFromMonthString(evt.data.data.originalMonth)

                            const params = {
                              assayId: assayIds,
                              minDate,
                              maxDate,
                              resultCategoryGroupId,
                              displayResult: 'actual',
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
                        graphId="tbByCategory1Aggregate"
                        graphTitle={[
                          formatMessage(graphMessages.clinicalIndicatorsTBPieLegend)
                            .split(' ')
                            .splice(
                              0,
                              Math.ceil(
                                formatMessage(graphMessages.clinicalIndicatorsTBPieLegend).split(' ').length / 2
                              )
                            )
                            .join(' '),
                          formatMessage(graphMessages.clinicalIndicatorsTBPieLegend)
                            .split(' ')
                            .splice(
                              Math.ceil(
                                formatMessage(graphMessages.clinicalIndicatorsTBPieLegend).split(' ').length / 2
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

export default TbRifDetectedGraph
