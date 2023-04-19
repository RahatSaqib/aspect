import React, { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'
import times from 'lodash/times'
import { useQuery } from 'react-query'
import Loading from '../../../../cleanComponents/Loading'
import EmptyGraph from '../../../../components/Graphs/EmptyData'
import { getTimePeriod, getGraphKeysFromResults } from '../../../../components/Graphs/Helpers/Formatters'
import AspectResponsiveLine from '../../../../components/Graphs/LineGraph/AspectResponsiveLine'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import useI18n from '../../../../hooks/useI18n'
import { months } from '../../../../messages'
import styles from '../styles.css'

const cssClasses = classnames.bind(styles)

const endpointParams = [
  { assay: 'GxMtbRif' },
  { assay: 'GxMtbRifUltra' },
  { groupBy: 'month' },
  { minDate: '2019-01-01' },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
  { resultCategory1: 'Detected' },
  { resultCategory2: 'Detected' },
]

const TrendInYearsRifDetectedGraphMain = ({ assaysFromState, showLabel, filterSelection }) => {
  const { formatMessage } = useI18n()
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)

  const mergedParams = filterSelection ? [...endpointParams, filterSelection] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['trendInYearsRifDetected', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/clinical-indicator-aggregations', params: mergedParams })
  )

  useEffect(() => {
    if (data) {
      const grouped = reduce(
        data.data,
        (acc, item) => {
          const [yyyy, mm] = item.month.split('-')
          let it = acc.find(({ id }) => id === yyyy)
          if (!it) {
            const xAxisLabels = times(12, month => `${formatMessage(months[month])}`)
            it = { id: yyyy, data: xAxisLabels.map(name => ({ x: name, y: null })) }
            acc = [...acc, it]
          }
          it.data[+mm - 1].y = item.cnt

          return acc
        },
        []
      ).reverse()

      if (grouped) {
        const keysFromGrouped = getGraphKeysFromResults(grouped, 'month')
        setGraphData(grouped)
        setGraphKeys(keysFromGrouped)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return isLoading ? (
    <Loading />
  ) : (
    <Grid item xs={12} md={12} lg={12}>
      <div className={cssClasses('Graph_Wrapper')}>
        {graphData && !isEmpty(graphData) ? (
          <AspectResponsiveLine
            assaysFromState={assaysFromState}
            config={{ id: 'tbRifDetectedYearlyTrends', showLabel, showDecimals: 0 }}
            data={graphData}
            keys={graphKeys}
            indexBy="month"
            formatDate="MMM"
            tickValuesYShape="none"
            tickValuesXShape="all"
            displayMethod="actual"
            displayLegend
            type="line-trends"
            i18nKeys={[]}
          />
        ) : (
          <EmptyGraph type="bar" />
        )}
      </div>
    </Grid>
  )
}

export default TrendInYearsRifDetectedGraphMain
