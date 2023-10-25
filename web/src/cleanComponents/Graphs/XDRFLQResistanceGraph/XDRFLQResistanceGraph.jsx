import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import classnames from 'classnames/bind'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import useI18n from '../../../hooks/useI18n'
import { graphMessages } from '../../../messages'
import { StateSelector, Loading } from '../../index'
import messages from '../graphMessages'
import styles from '../graphStyles.css'
import { ColumnLineGraph } from '../index'

const cssClasses = classnames.bind(styles)

const now = new Date()
const minDate = format(startOfMonth(subMonths(now, 12)), 'yyyy-MM-dd')
const maxDate = format(endOfMonth(now), 'yyyy-MM-dd')
const endpointParams = [{ minDate }, { maxDate }]

const XDRFLQResistanceGraph = () => {
  const { formatMessage } = useI18n()

  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState()

  const mergedParams = filter ? [...endpointParams, filter] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['xdrAssayGraph', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/xdr-assay-graph', params: mergedParams })
  )

  const mtbDetectedMessage = formatMessage(messages.MtbDetected)
  const inhDetectedMessage = formatMessage(messages.InhDetected)
  const fqrDetectedMessage = formatMessage(messages.FqrDetected)
  const totalTestsMessage = formatMessage(messages.TotalTests)
  const FQRPercentMessage = formatMessage(messages.FQRPercent)

  const [graphData, setGraphData] = useState()
  useEffect(() => {
    if (data) {
      const line = []
      const bar = []
      data.grouped.map(({ month, FqrToMtbPercentage, TotalTests, MtbDetected, FqrDetected, InhDetected }) => {
        line.push({ month, [FQRPercentMessage]: +FqrToMtbPercentage.toFixed(2) })
        bar.push({ month, value: TotalTests, type: totalTestsMessage })
        bar.push({ month, value: MtbDetected, type: mtbDetectedMessage })
        bar.push({ month, value: FqrDetected, type: fqrDetectedMessage })
        bar.push({ month, value: InhDetected, type: inhDetectedMessage })
        return {}
      })

      setGraphData([bar, line])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return isLoading ? (
    <Loading />
  ) : (
    <Grid container className={cssClasses('Graph_Container')}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={formatMessage(graphMessages.xdrPercentageFQRDetectedOverMTBDetectedGraphTitle)} />
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
                      graphId="xdrAssayGraph"
                      colors={[
                        { name: totalTestsMessage, colorId: 'caseTotal' },
                        { name: mtbDetectedMessage, colorId: '--aspect-color-slate' },
                        { name: fqrDetectedMessage, colorId: 'caseDetected' },
                        { name: inhDetectedMessage, colorId: 'casePercentDetectedOfTotal' },
                        { name: FQRPercentMessage, colorId: 'casePercentDetectedOfTotal' },
                      ]}
                      xField="month"
                      yField={['value', FQRPercentMessage]}
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

export default XDRFLQResistanceGraph
