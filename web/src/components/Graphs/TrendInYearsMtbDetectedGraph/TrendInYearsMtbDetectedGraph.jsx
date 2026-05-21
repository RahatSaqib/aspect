import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { graphMessages, months } from '../../../messages'
import { GRAPHS_QUERY_OPTIONS } from '../../../utils/consts/ReactQuery/CONSTS'
import { StateSelector, Loading } from '../../index'
import fetchWrapperForQueries from '../../QueryFetch'
import styles from '../graphStyles.module.css'
import { fillYear } from '../graphUtils'
import { getTimePeriod } from '../Helpers/Formatters'
import { LineGraph } from '../index'

const endpointParams = [
  { assay: 'GxMtbRif' },
  { assay: 'GxMtbRifUltra' },
  { groupBy: 'month' },
  { minDate: '2019-01-01' },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
  { resultCategory1: 'Detected' },
]

const TrendInYearsMtbDetectedGraph = () => {
  const { formatMessage } = useIntl()

  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState()
  const mergedParams = filter ? [...endpointParams, filter] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['tbMtbDetectedYearlyTrends', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/clinical-indicator-aggregations', params: mergedParams }),
    { ...GRAPHS_QUERY_OPTIONS }
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
        setGraphData(fillYear(grouped, formatMessage))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return isLoading ? (
    <Loading />
  ) : (
    <Grid container className={styles.Graph_Container}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={formatMessage(graphMessages.mtbDetectedTrendsInYearTitle)} />
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
                  <Grid item xs={12} md={8} lg={12} className={styles.Graph_Content_AssaySelector}>
                    <StateSelector filter={filter} onChange={setFilter} />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={12} lg={10}>
                <Grid container>
                  <Grid item xs={12} md={12} lg={12}>
                    <LineGraph
                      data={graphData}
                      showLabel={showLabel}
                      graphId="tbMtbDetectedYearlyTrends"
                      xField="month"
                      yField="value"
                      seriesField="year"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default TrendInYearsMtbDetectedGraph
