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

const covidCasesByAgeAndGender = {
  id: 'covidCasesByAgeAndGender',
  title: 'covidGraphDailyMortalityAndRecoveryByGenderAndGender',
  assays: ['assayGXCovid19', 'assayMP96Covid19', 'assayQS7Covid19', 'assayGenericCovid19'],
  graphRenderPermissions: ['covid'],
  graphType: [
    {
      id: 'outcomeByGender',
      component: BarGraph,
      type: 'divergent',
      size: 12,
      componentClasses: ['BARCLASS'],
      api: {
        endpoint: '/result/follow-up-aggregations',
        params: {
          groupBy: ['day', 'gender', 'age'],
          followUpType: 'outcome',
          [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
          [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
        },
      },
      indexBy: 'inRange',
      keyToConsume: 'gender',
      filterBy: {
        followUp: { values: ['died', 'recovered'] },
      },
      tickValuesYShape: 'all',
      tickValuesXShape: 'all',
      displayMethod: 'actual',
      displayLegend: true,
      formatDate: 'dd MMM',
    },
  ],
}

const CovidMortalityAndRecoveryGraph = ({ assays }) => {
  return (
    <ErrorBoundary key={covidCasesByAgeAndGender.id}>
      <PermissionsProvider permissions={covidCasesByAgeAndGender.graphRenderPermissions}>
        <GraphsContainer assaysFromState={assays} config={covidCasesByAgeAndGender} />
      </PermissionsProvider>
    </ErrorBoundary>
  )
}

export default CovidMortalityAndRecoveryGraph
