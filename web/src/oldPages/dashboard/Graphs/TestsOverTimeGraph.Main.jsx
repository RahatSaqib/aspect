import React from 'react'
import ErrorBoundary from '../../../components/ErrorBoundary'
import BarGraph from '../../../components/Graphs/BarGraph'
import GraphRender from '../../../components/Graphs/GraphRender'
import { getTimePeriod } from '../../../components/Graphs/Helpers/Formatters'
import useI18n from '../../../hooks/useI18n'
import DATE_CONSTS from '../../../utils/consts/DateTime/CONSTS'

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

const mainGraph = {
  id: 'testPerformedMonthlyPercentage',
  component: BarGraph,
  type: 'bar',
  size: 8,
  componentClasses: ['BARCLASS'],
  api: {
    endpoint: '/result/clinical-indicator-aggregations',
    params: {
      groupBy: ['month', 'assay'],
      [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
      [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
    },
  },
  i18nKey: 'assayI18nKey',
  indexBy: 'month',
  keyToConsume: 'assay',
  tickValuesYShape: 'none',
  tickValuesXShape: 'all',
  displayMethod: 'actual',
  displayLegend: true,
  formatDate: 'MMM',
  clickThrough: {
    allow: true,
    baseUrl: '/browse/result?filters=',
    keys: ['assay', 'indexBy'],
  },
}

const TestsOverTimeGraphMain = ({ assaysFromState, clientSideFilter }) => {
  const { formatMessage } = useI18n()

  return (
    <ErrorBoundary>
      <GraphRender
        assays={{ whiteListed: [], assaysFromState }}
        config={mainGraph}
        key={mainGraph.id}
        id={mainGraph.id}
        updatedParams={false}
        formatMessage={formatMessage}
        clientSideFilter={clientSideFilter}
        isOwnerReady
      />
    </ErrorBoundary>
  )
}

export default TestsOverTimeGraphMain
