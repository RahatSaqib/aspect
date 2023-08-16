import React, { useCallback, useEffect, useState } from 'react'
import { Grid, Typography } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'
import times from 'lodash/times'
import { useQuery } from 'react-query'
import Loading from '../../../../cleanComponents/Loading'
import EmptyGraph from '../../../../components/Graphs/EmptyData'
import { getGraphKeysFromResults } from '../../../../components/Graphs/Helpers/Formatters'
import AspectResponsiveLine from '../../../../components/Graphs/LineGraph/AspectResponsiveLine'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import useI18n from '../../../../hooks/useI18n'
import { months } from '../../../../messages'
import AnnualGraph from '../../../../pages/PkDashboard/components/AnnualGraph'
import styles from '../styles.css'
import messages from '../../../../pages/PkDashboard/PkDashboard.Messages'
import GraphTitle from '../../../../pages/PkDashboard/components/GraphTitle'

const cssClasses = classnames.bind(styles)

const maxDate = new Date()

const endpointParams = [{ groupBy: 'month' }, { minDate: `${maxDate.getFullYear() - 5}-01-01` }, { maxDate }]

const TrendInYearsAllTestsGraphMain = ({ assaysFromState, showLabel, filterSelection, withAnnual, withTitles }) => {
  const { formatMessage } = useI18n()
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)
  const [annual, setAnnual] = useState()

  const mergedParams = filterSelection ? [...endpointParams, ...filterSelection] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['tbAllTestsYearlyTrends', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/gx-10c-trends-national', params: mergedParams })
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

      setAnnual(grouped.map(({ id, data }) => ({ year: id, Annual: data.reduce((prev, curr) => prev + curr.y, 0) })))

      if (grouped) {
        const keysFromGrouped = getGraphKeysFromResults(grouped, 'month')
        setGraphData(grouped)
        setGraphKeys(keysFromGrouped)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const renderLineGraph = useCallback(
    () => (
      <Grid item xs={12} md={12} lg={12}>
        <div className={cssClasses('Graph_Wrapper')}>
          {graphData && !isEmpty(graphData) ? (
            <>
              {withTitles ? <GraphTitle>{formatMessage(messages.monthlyTestingTrends)}</GraphTitle> : null}
              <AspectResponsiveLine
                assaysFromState={assaysFromState}
                config={{ id: 'tbAllTestsYearlyTrends', showLabel, showDecimals: 0 }}
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
            </>
          ) : (
            <EmptyGraph type="bar" />
          )}
        </div>
      </Grid>
    ),
    [assaysFromState, graphData, graphKeys, showLabel, withTitles]
  )

  return isLoading ? (
    <Loading />
  ) : withAnnual ? (
    <Grid container sx={{ mt: 2 }}>
      <AnnualGraph
        title={withTitles ? formatMessage(messages.annualTestingTrends) : null}
        data={annual}
        showLabel={showLabel}
      />
      <Grid item xs={12} md={8} lg={8} container>
        {renderLineGraph()}
      </Grid>
    </Grid>
  ) : (
    <Grid container sx={{ mt: 2 }}>
      <Grid item container>
        {renderLineGraph()}
      </Grid>
    </Grid>
  )
}

export default TrendInYearsAllTestsGraphMain
