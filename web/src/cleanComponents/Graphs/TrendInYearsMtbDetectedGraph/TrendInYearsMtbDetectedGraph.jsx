import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import { getTimePeriod } from '../../../components/Graphs/Helpers/Formatters'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import useI18n from '../../../hooks/useI18n'
import { graphMessages, months } from '../../../messages'
import StateSelector from '../../../oldPages/dashboard/Graphs/StateSelector'
import ErrorBoundary from '../../ErrorBoundary'
import Loading from '../../Loading'
import styles from '../graphStyles.css'
import { fillYear } from '../graphUtils'
import { LineGraph } from '../index'

const cssClasses = classnames.bind(styles)

const endpointParams = [
  { assay: 'GxMtbRif' },
  { assay: 'GxMtbRifUltra' },
  { groupBy: 'month' },
  { minDate: '2019-01-01' },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
  { resultCategory1: 'Detected' },
]

const TrendInYearsMtbDetectedGraph = () => {
  const { formatMessage } = useI18n()

  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState()

  const mergedParams = filter ? [...endpointParams, filter] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['tbMtbDetectedYearlyTrends', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/clinical-indicator-aggregations', params: mergedParams })
  )

  const [graphData, setGraphData] = useState(false)
  useEffect(() => {
    if (data) {
      const grouped = data.data
        .map(item => ({ year: item.month.split('-')[0], month: item.month.split('-')[1], value: item.cnt }))
        .sort((a, b) => b.month - a.month || b.year - a.year)
        .reverse()
        .map(item => ({ ...item, month: `${formatMessage(months[item.month - 1])}` }))

      if (grouped) {
        setGraphData(fillYear(grouped))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return isLoading ? (
    <Loading />
  ) : (
    <ErrorBoundary>
      <Grid container className={cssClasses('Graph_Container')}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title={formatMessage(graphMessages.mtbDetectedTrendsInYearTitle)} />
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
                    <Grid item xs={12} md={8} lg={12} className={cssClasses('Graph_Content_AssaySelector')}>
                      <StateSelector onChange={setFilter} />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} md={12} lg={10}>
                  <Grid container>
                    <Grid item xs={12} md={12} lg={12}>
                      <LineGraph data={graphData} showLabel={showLabel} graphId="tbMtbDetectedYearlyTrends" />
                    </Grid>
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

export default TrendInYearsMtbDetectedGraph
