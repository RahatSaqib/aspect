import React, { useEffect, useState } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import { useQuery } from 'react-query'
import Loading from '../../../cleanComponents/Loading'
import AspectResponsiveBar from '../../../components/Graphs/BarGraph/AspectResponsiveBar'
import AxisRightLayer from '../../../components/Graphs/BarGraph/AxisRightLayer'
import EmptyGraph from '../../../components/Graphs/EmptyData'
import { getTimePeriod } from '../../../components/Graphs/Helpers/Formatters'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import GraphTitle from './GraphTitle'
import styles from './styles.css'
import { FqrToMtbPercentageLine, FqrToMtbPercentageLineWithLabel } from './XDRFLQResistanceGraph.Main.Layers'

const cssClasses = classnames.bind(styles)

const baseConfig = {
  id: 'xdrAssayGraph',
  groupMode: 'grouped',
  fields: [
    { name: 'TotalTests', colorId: 'caseTotal', target: 'bar' },
    { name: 'MtbDetected', colorId: '--aspect-color-slate', target: 'bar' },
    { name: 'FqrDetected', colorId: 'caseDetected', target: 'bar' },
    { name: 'InhDetected', colorId: 'casePercentDetectedOfTotal', target: 'bar' },
    { name: 'FqrToMtbPercentage', colorId: 'casePercentDetectedOfTotal', target: 'line' },
  ],
  clickThrough: false,
  axisRightProps: {
    fieldName: 'FqrToMtbPercentage',
  },
}

const endpointParams = [
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const XDRFLQResistanceGraphMain = ({ assaysFromState, showLabel, filterSelection, title }) => {
  const [i18nKeys, setI18nKeys] = useState([])
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)

  const mergedParams = filterSelection ? [...endpointParams, ...filterSelection] : [...endpointParams]

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
    <Grid item xs={12} md={12} lg={12}>
      <div className={cssClasses('Graph_Wrapper')}>
        {graphData && !isEmpty(graphData) ? (
          <>
            {title ? <GraphTitle sx={{ mt: '10px' }}>{title}</GraphTitle> : null}
            <AspectResponsiveBar
              assaysFromState={assaysFromState}
              config={{
                ...baseConfig,
                layers: [showLabel ? FqrToMtbPercentageLineWithLabel : FqrToMtbPercentageLine, AxisRightLayer],
                showLabel,
                showDecimals: 0,
                labelTextColor: '#333',
              }}
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
          </>
        ) : (
          <EmptyGraph type="bar" />
        )}
      </div>
    </Grid>
  )
}

export default XDRFLQResistanceGraphMain
