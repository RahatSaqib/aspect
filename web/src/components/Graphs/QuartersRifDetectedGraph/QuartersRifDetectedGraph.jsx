import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { graphMessages } from '../../../messages'
import { GRAPHS_QUERY_OPTIONS } from '../../../utils/consts/ReactQuery/CONSTS'
import { StateSelector, LoadingCard } from '../../index'
import fetchWrapperForQueries from '../../QueryFetch'
import messages from '../graphMessages'
import styles from '../graphStyles.module.css'
import { getTimePeriod } from '../Helpers/Formatters'
import { ColumnLineGraph } from '../index'

const endpointParams = [
  { groupBy: 'resultCategory1' },
  { groupBy: 'resultCategory2' },
  { minDate: '2019-01-01' },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const QuartersRifDetectedGraph = () => {
  const { formatMessage } = useIntl()

  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState()

  const mergedParams = filter ? [...endpointParams, filter] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['tbRifDetectedQuarterlyTrends', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/trend-in-quarters-rif-detected', params: mergedParams }),
    { ...GRAPHS_QUERY_OPTIONS }
  )

  const mtbDetectedMessage = formatMessage(messages.MtbDetected)
  const rrdDetectedMessage = formatMessage(messages.RRDHash)
  const percentageMessage = formatMessage(messages.RRDPercent)

  const [graphData, setGraphData] = useState()
  useEffect(() => {
    if (data) {
      const line = []
      const bar = []
      data.grouped.map(({ quarter, RrdToMtbPercentage, RrdDetected, MtbDetected }) => {
        line.push({ quarter, [percentageMessage]: +RrdToMtbPercentage.toFixed(2) })
        bar.push({ quarter, value: MtbDetected, type: mtbDetectedMessage })
        bar.push({ quarter, value: RrdDetected, type: rrdDetectedMessage })
        return {}
      })

      setGraphData([bar, line])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return isLoading ? (
    <LoadingCard />
  ) : (
    <Grid container className={styles.Graph_Container}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={formatMessage(graphMessages.rifDetectedTrendsInQuarterTitle)} />
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
                    <ColumnLineGraph
                      data={graphData}
                      showLabel={showLabel}
                      graphId="tbRifDetectedQuarterlyTrends"
                      colors={[
                        { name: mtbDetectedMessage, colorId: 'caseTotal' },
                        { name: rrdDetectedMessage, colorId: 'caseDetected' },
                        { name: percentageMessage, colorId: 'casePercentDetectedOfTotal' },
                      ]}
                      xField="quarter"
                      yField={['value', percentageMessage]}
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

export default QuartersRifDetectedGraph
