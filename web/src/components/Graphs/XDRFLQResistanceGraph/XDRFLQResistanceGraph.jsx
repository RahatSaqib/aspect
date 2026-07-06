import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { format } from 'date-fns-tz'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { graphMessages } from '../../../messages'
import pkMessages from '../../../pages/PkDashboard/PkDashboard.Messages'
import { GRAPHS_QUERY_OPTIONS } from '../../../utils/consts/ReactQuery/CONSTS'
import { StateSelector, Loading, AspectSelect } from '../../index'
import fetchWrapperForQueries from '../../QueryFetch'
import messages from '../graphMessages'
import styles from '../graphStyles.module.css'
import { ColumnLineGraph } from '../index'

const now = new Date()
const minDate = format(startOfMonth(subMonths(now, 12)), 'yyyy-MM-dd')
const maxDate = format(endOfMonth(now), 'yyyy-MM-dd')
const endpointParams = [{ minDate }, { maxDate }]

const XDRFLQResistanceGraph = () => {
  const { formatMessage } = useIntl()

  const lineSource = useMemo(
    () => [formatMessage(messages.FQRPercent), formatMessage(messages.INHPercent)],
    [formatMessage]
  )

  const [lineFor, setLineFor] = useState(lineSource[0])

  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState()

  const mergedParams = filter ? [...endpointParams, filter] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['xdrAssayGraph', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/xdr-assay-graph', params: mergedParams }),
    { ...GRAPHS_QUERY_OPTIONS }
  )

  const mtbDetectedMessage = formatMessage(messages.MtbDetected)
  const inhDetectedMessage = formatMessage(messages.InhDetected)
  const fqrDetectedMessage = formatMessage(messages.FqrDetected)
  const totalTestsMessage = formatMessage(messages.TotalTests)
  const FQRPercentMessage = formatMessage(messages.FQRPercent)
  const INHPercentMessage = formatMessage(messages.INHPercent)

  const graphData = useMemo(() => {
    if (!data) return undefined

    const line = []
    const bar = []
    data.grouped.map(
      ({ month, FqrToMtbPercentage, InhToMtbPercentage, TotalTests, MtbDetected, FqrDetected, InhDetected }) => {
        if (lineFor === FQRPercentMessage) {
          line.push({ month, [FQRPercentMessage]: +FqrToMtbPercentage.toFixed(1) })
        } else if (lineFor === INHPercentMessage) {
          line.push({ month, [INHPercentMessage]: +InhToMtbPercentage.toFixed(1) })
        }
        bar.push({ month, value: TotalTests, type: totalTestsMessage })
        bar.push({ month, value: MtbDetected, type: mtbDetectedMessage })
        bar.push({ month, value: FqrDetected, type: fqrDetectedMessage })
        bar.push({ month, value: InhDetected, type: inhDetectedMessage })
        return {}
      }
    )

    return [bar, line]
  }, [
    data,
    lineFor,
    FQRPercentMessage,
    INHPercentMessage,
    totalTestsMessage,
    mtbDetectedMessage,
    fqrDetectedMessage,
    inhDetectedMessage,
  ])

  return isLoading ? (
    <Loading />
  ) : (
    <Grid container className={styles.Graph_Container}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={formatMessage(graphMessages.mtbXDRDrugResistance)} />
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
                  <Grid item xs={12} md={8} lg={12} className={styles.Graph_Content_AssaySelector}>
                    <AspectSelect
                      fullWidth
                      disableClearable
                      options={lineSource}
                      label={formatMessage(pkMessages.showLineFor)}
                      value={lineFor}
                      onChange={setLineFor}
                      itemToString={i => i ?? ''}
                    />
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
                        { name: lineFor, colorId: 'casePercentDetectedOfTotal' },
                      ]}
                      xField="month"
                      yField={['value', lineFor]}
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
