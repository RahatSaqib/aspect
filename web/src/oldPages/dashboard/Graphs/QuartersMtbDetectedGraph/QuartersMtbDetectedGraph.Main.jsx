import React, { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import { useQuery } from 'react-query'
import AspectResponsiveBar from '../../../../components/Graphs/BarGraph/AspectResponsiveBar'
import AxisRightLayer from '../../../../components/Graphs/BarGraph/AxisRightLayer'
import EmptyGraph from '../../../../components/Graphs/EmptyData'
import { getTimePeriod } from '../../../../components/Graphs/Helpers/Formatters'
import Loading from '../../../../components/Loading'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import useI18n from '../../../../hooks/useI18n'
import { months } from '../../../../messages'
import styles from '../styles.css'
import { MtbToTotalPercentage, MtbToTotalPercentageWithLabel } from './QuartersMtbDetectedGraph.Main.Layers'

const cssClasses = classnames.bind(styles)

const baseConfig = {
  id: 'tbMtbDetectedQuarterlyTrends',
  groupMode: 'grouped',
  fields: [
    { name: 'Total', colorId: 'caseTotal', target: 'bar' },
    { name: 'MtbDetected', colorId: 'caseDetected', target: 'bar' },
    { name: 'MtbToTotalPercentage', colorId: 'casePercentDetectedOfTotal', target: 'line' },
  ],
  clickThrough: false,
}

const endpointParams = [
  { groupBy: 'resultCategory1' },
  { minDate: '2019-01-01' },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const QuartersMtbDetectedGraphMain = ({ assaysFromState, showLabel, filterSelection }) => {
  const { formatMessage } = useI18n()
  const [i18nKeys, setI18nKeys] = useState([])
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)

  const mergedParams = filterSelection ? [...endpointParams, filterSelection] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['tbMtbDetectedQuarterlyTrends', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/trend-in-quarters-mtb-detected', params: mergedParams })
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
    <Grid item xs={12} md={12} lg={9}>
      <div className={cssClasses('Graph_Wrapper')}>
        {graphData && !isEmpty(graphData) ? (
          <AspectResponsiveBar
            assaysFromState={assaysFromState}
            config={{
              ...baseConfig,
              layers: [showLabel ? MtbToTotalPercentageWithLabel : MtbToTotalPercentage, AxisRightLayer],
              showLabel,
              showDecimals: 0,
              labelTextColor: '#333',
            }}
            data={graphData}
            keys={graphKeys}
            indexBy="quarter"
            formatDate={value => {
              const [yyyy, qq] = `${value}`.split('-')
              return `${formatMessage(months.QUARTER)}${qq}-${yyyy.substring(2)}`
            }}
            tickValuesYShape="twos"
            tickValuesXShape="all"
            displayMethod="actual"
            displayLegend
            type="bar-line"
            i18nKeys={i18nKeys}
          />
        ) : (
          <EmptyGraph type="bar" />
        )}
      </div>
    </Grid>
  )
}

export default QuartersMtbDetectedGraphMain
