import React from 'react'
import ErrorBoundary from '../../../components/ErrorBoundary'
import GraphRender from '../../../components/Graphs/GraphRender'
import { getTimePeriod } from '../../../components/Graphs/Helpers/Formatters'
import PieGraph from '../../../components/Graphs/PieGraph'
import useI18n from '../../../hooks/useI18n'
import DATE_CONSTS from '../../../utils/consts/DateTime/CONSTS'

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

const sideGraph = {
  id: 'testPerformedMonthlytotal',
  component: PieGraph,
  type: 'pie',
  size: 4,
  componentClasses: ['piegraph__container'],
  api: {
    endpoint: '/result/clinical-indicator-aggregations',
    params: {
      groupBy: ['month', 'assay'],
      [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
      [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
    },
  },
  i18nKey: 'assayI18nKey',
  indexBy: 'cnt',
  keyToConsume: 'assay',
  displayMethod: 'percentage',
  formatDate: 'MMM yy',
  averages: {
    showTotal: false,
    totalDisplayMethod: 'actual',
    title: 'testsOverTimeAvgTitle',
    key: '*',
    subTitle: null,
  },
}

const TestsOverTimeGraphSide = ({ assaysFromState, clientSideFilter }) => {
  const { formatMessage } = useI18n()

  return (
    <ErrorBoundary>
      <GraphRender
        assays={{ whiteListed: [], assaysFromState }}
        config={sideGraph}
        key={sideGraph.id}
        id={sideGraph.id}
        updatedParams={false}
        formatMessage={formatMessage}
        clientSideFilter={clientSideFilter}
        isOwnerReady
      />
    </ErrorBoundary>
  )
}

export default TestsOverTimeGraphSide
