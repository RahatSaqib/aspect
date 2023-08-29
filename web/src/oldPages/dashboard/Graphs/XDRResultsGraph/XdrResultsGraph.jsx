import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import classnames from 'classnames/bind'
import filter from 'lodash/filter'
import reduce from 'lodash/reduce'
import { useQuery } from 'react-query'
import ErrorBoundary from '../../../../cleanComponents/ErrorBoundary'
import DonutGraph from '../../../../cleanComponents/Graphs/DonutGraph/DonutGraph'
import Loading from '../../../../cleanComponents/Loading'
import {
  getTimePeriod,
  formatDataByGraphType,
  getAverageFromData,
  calcPercentageForGraphs,
  translateLabel,
} from '../../../../components/Graphs/Helpers/Formatters'
import messages from '../../../../components/Graphs/intlMessages'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import useI18n from '../../../../hooks/useI18n'
import { graphMessages } from '../../../../messages'
import styles from '../styles.css'
import XdrResultsGraphMain from './XdrResultsGraph.Main'

const cssClasses = classnames.bind(styles)

const endPointParams = [
  { assay: 'GxMtbXdr' },
  { groupBy: 'month' },
  { groupBy: 'resultCategory2' },
  { groupBy: 'resultCategory1' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
  { flags: 'GET_TOTAL_RESULTS' },
]

const XdrResultsGraph = ({ assaysFromState }) => {
  const { formatMessage } = useI18n()
  const [showLabel, setShowLabel] = useState(false)

  const { data, isLoading } = useQuery(
    ['xdrByCategory1Monthly', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/clinical-indicator-aggregations', params: endPointParams })
  )

  // code for donut
  const [donutData, setDonutData] = useState({})
  useEffect(() => {
    if (data && data.data) {
      const info = data.data
      const i18nKeysCollection = reduce(
        info,
        (acc, curr) => {
          acc[curr.resultCategory2] = curr.resultCategory2I18nKey
          return acc
        },
        {}
      )
      const graphData = formatDataByGraphType(
        info,
        'percentage',
        { resultCategory1: { values: ['Detected'] } },
        'MMM yy',
        'cnt',
        'resultCategory2',
        i18nKeysCollection,
        'pie',
        endPointParams,
        formatMessage,
        messages
      )
      const translations = graphData.map(g => ({
        id: g.id,
        t: translateLabel(g.id, assaysFromState, formatMessage, messages, i18nKeysCollection),
      }))
      const total = graphData.reduce((acc, curr) => acc + curr.value, 0)
      const { avg } = getAverageFromData(graphData, 'value', ['Detected'], 'standard')
      const parsedData = graphData.map(d => ({
        ...d,
        label: translations.filter(t => t.id === d.id)[0].t,
        value: total < 1 ? total : +calcPercentageForGraphs(d.value, total, 2),
      }))
      setDonutData({ data: parsedData, total: `${avg}%` })
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
            <CardHeader title={formatMessage(graphMessages.clinicalIndicatorsXdrTitle)} />
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
                    <XdrResultsGraphMain
                      data={data.data}
                      endPointParams={endPointParams}
                      assaysFromState={assaysFromState}
                      showLabel={showLabel}
                    />
                    {donutData.data && donutData.data.length ? (
                      <Grid item xs={12} md={4} lg={4}>
                        <DonutGraph
                          data={donutData.data}
                          total={donutData.total}
                          graphId="xdrByCategory1Aggregate"
                          graphTitle={[
                            formatMessage(graphMessages.clinicalIndicatorsXdrPieLegend)
                              .split(' ')
                              .splice(
                                0,
                                Math.ceil(
                                  formatMessage(graphMessages.clinicalIndicatorsXdrPieLegend).split(' ').length / 2
                                )
                              )
                              .join(' '),
                            formatMessage(graphMessages.clinicalIndicatorsXdrPieLegend)
                              .split(' ')
                              .splice(
                                Math.ceil(
                                  formatMessage(graphMessages.clinicalIndicatorsXdrPieLegend).split(' ').length / 2
                                )
                              )
                              .join(' '),
                          ].join('<br/>')} // "Average Monthly<br/>Test Performed"
                          legend={false}
                          showLabel={showLabel}
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
    </ErrorBoundary>
  )
}

export default XdrResultsGraph
