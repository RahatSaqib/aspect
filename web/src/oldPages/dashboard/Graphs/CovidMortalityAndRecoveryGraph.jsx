import React from 'react'
import ErrorBoundary from '../../../components/ErrorBoundary'
import BarGraph from '../../../components/Graphs/BarGraph'
import GraphsContainer from '../../../components/Graphs/GraphsContainer'
import { getTimePeriod } from '../../../components/Graphs/Helpers/Formatters'
import PermissionsProvider from '../../../providers/PermissionsProvider'
import DATE_CONSTS from '../../../utils/consts/DateTime/CONSTS'

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

const covidMortalityAndRecoveryConfig = {
  id: 'covidMortalityAndRecoveryConfig',
  title: 'covidGraphDailyMortalityAndrecovery',
  componentSize: 'full',
  group: 'covid',
  assays: ['assayGXCovid19', 'assayMP96Covid19', 'assayQS7Covid19', 'assayGenericCovid19'],
  graphRenderPermissions: ['covid'],
  graphType: [
    {
      id: 'deathsPerDay',
      component: BarGraph,
      type: 'bar',
      size: 6,
      componentClasses: ['BARCLASS'],
      api: {
        endpoint: '/result/follow-up-aggregations',
        params: {
          groupBy: ['day'],
          followUp: 'died',
          followUpType: 'outcome',
          [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
          [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
        },
      },
      indexBy: 'day',
      keyToConsume: 'followUp',
      displayMethod: 'actual',
      displayLegend: true,
      tickValuesYShape: 'clubsandwich',
      tickValuesXShape: 'bookends',
      formatDate: 'dd MMM',
    },
    {
      id: 'recoveriesPerDay',
      component: BarGraph,
      type: 'bar',
      size: 6,
      componentClasses: ['BARCLASS'],
      api: {
        endpoint: '/result/follow-up-aggregations',
        params: {
          groupBy: ['day'],
          followUp: 'recovered',
          followUpType: 'outcome',
          [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
          [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
        },
      },
      indexBy: 'day',
      keyToConsume: 'followUp',
      displayMethod: 'actual',
      displayLegend: true,
      tickValuesYShape: 'bookends',
      tickValuesXShape: 'bookends',
      formatDate: 'dd MMM',
    },
  ],
}

const CovidMortalityAndRecoveryGraph = ({ assays }) => {
  return (
    <ErrorBoundary key={covidMortalityAndRecoveryConfig.id}>
      <PermissionsProvider permissions={covidMortalityAndRecoveryConfig.graphRenderPermissions}>
        <GraphsContainer assaysFromState={assays} config={covidMortalityAndRecoveryConfig} />
      </PermissionsProvider>
    </ErrorBoundary>
  )
}

export default CovidMortalityAndRecoveryGraph
