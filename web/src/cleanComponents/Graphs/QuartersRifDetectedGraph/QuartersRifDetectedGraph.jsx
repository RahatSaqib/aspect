import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import { getTimePeriod } from '../../../components/Graphs/Helpers/Formatters'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import useI18n from '../../../hooks/useI18n'
import { graphMessages } from '../../../messages'
import StateSelector from '../../../oldPages/dashboard/Graphs/StateSelector'
import ErrorBoundary from '../../ErrorBoundary'
import Loading from '../../Loading'
import styles from '../graphStyles.css'
import { BarLineGraph } from '../index'

const cssClasses = classnames.bind(styles)

const endpointParams = [
  { groupBy: 'resultCategory1' },
  { groupBy: 'resultCategory2' },
  { minDate: '2019-01-01' },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const QuartersRifDetectedGraph = () => {
  const { formatMessage } = useI18n()

  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState()

  const mergedParams = filter ? [...endpointParams, filter] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['tbRifDetectedQuarterlyTrends', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/trend-in-quarters-rif-detected', params: mergedParams })
  )

  const [graphData, setGraphData] = useState()
  useEffect(() => {
    if (data) {
      const line = []
      const bar = []
      data.grouped.map(({ quarter, RrdToMtbPercentage, RrdDetected, MtbDetected }) => {
        line.push({ quarter, percentage: +RrdToMtbPercentage.toFixed(2) })
        bar.push({ quarter, value: MtbDetected, type: 'MtbDetected' })
        bar.push({ quarter, value: RrdDetected, type: 'RrdDetected' })
        return {}
      })

      setGraphData([bar, line])
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
            <CardHeader title={formatMessage(graphMessages.rifDetectedTrendsInQuarterTitle)} />
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
                      <BarLineGraph
                        data={graphData}
                        showLabel={showLabel}
                        graphId="tbRifDetectedQuarterlyTrends"
                        colors={[
                          { name: 'MtbDetected', colorId: 'caseTotal' },
                          { name: 'RrdDetected', colorId: 'caseDetected' },
                          { name: 'percentage', colorId: 'casePercentDetectedOfTotal' },
                        ]}
                        xField="quarter"
                      />
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

export default QuartersRifDetectedGraph
