import React, { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid'
import isEmpty from 'lodash/isEmpty'
import { useQuery } from 'react-query'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import AspectResponsiveBar from '../../../../components/Graphs/BarGraph/AspectResponsiveBar'
import AxisRightLayer from '../../../../components/Graphs/BarGraph/AxisRightLayer'
import { getTimePeriod } from '../../../../components/Graphs/Helpers/Formatters'
import Loading from '../../../../components/Loading'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import { FqrToMtbPercentageLine } from './XDRFLQResistanceGraph.Main.Layers'

const baseConfig = {
  id: 'xdrAssayGraph',
  groupMode: 'grouped',
  fields: [
    { name: 'TotalTests', colorId: 'caseTotal', target: 'bar' },
    { name: 'MtbDetected', colorId: '--aspect-color-slate', target: 'bar' },
    { name: 'FqrDetected', colorId: 'caseDetected', target: 'bar' },
    { name: 'FqrToMtbPercentage', colorId: 'casePercentDetectedOfTotal', target: 'line' },
  ],
  layers: [FqrToMtbPercentageLine, AxisRightLayer],
  clickThrough: false,
}

const endpointParams = [
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const XDRFLQResistanceGraph = ({ assaysFromState, showLabel, filterSelection }) => {
  const [i18nKeys, setI18nKeys] = useState([])
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)

  const mergedParams = filterSelection ? [...endpointParams, filterSelection] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['xdrAssayGraph', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/xdr-assay-graph', params: mergedParams })
  )

  useEffect(() => {
    if (data) {
      const { grouped, keysFromGrouped, i18nKeys } = data
      setI18nKeys(i18nKeys)
      setGraphData(grouped)
      setGraphKeys(keysFromGrouped)
    }
  }, [data])

  return isLoading ? (
    <Loading />
  ) : (
    <ErrorBoundary>
      <Grid item xs={12} md={12} lg={9}>
        <Grid container>
          <Grid container direction="row" spacing={8}>
            <Grid item xs={12} md={12} lg={12}>
              {graphData && !isEmpty(graphData) ? (
                <AspectResponsiveBar
                  assaysFromState={assaysFromState}
                  config={{ ...baseConfig, showLabel, showDecimals: 0, labelTextColor: '#333' }}
                  data={graphData}
                  keys={graphKeys}
                  indexBy="month"
                  formatDate={(value, i18n) =>
                    /**
                     * 'value' has pattern `yyyy-mm` (i.e. `2022-07`), and to correctly
                     * format it to `Jul-22` with taking into account timezones, let's
                     * consider mid-month date - so, convert `yyyy-mm` to `yyyy-mm-15`
                     */
                    i18n.format(new Date(`${value}-15`), 'MMM-yy')
                  }
                  tickValuesYShape="twos"
                  tickValuesXShape="all"
                  displayMethod="actual"
                  displayLegend
                  type="bar-line"
                  i18nKeys={i18nKeys}
                />
              ) : null}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </ErrorBoundary>
  )
}

export default XDRFLQResistanceGraph
