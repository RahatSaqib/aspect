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

const covidDailyConfirmed = {
  id: 'covidDailyConfirmed',
  title: 'clinicalIndicatorsCovidName',
  assays: ['assayGXCovid19', 'assayMP96Covid19', 'assayQS7Covid19', 'assayGenericCovid19'],
  graphRenderPermissions: ['covid'],
  graphType: [
    {
      id: 'dailyConfirmed',
      component: BarGraph,
      type: 'bar',
      size: 12,
      componentClasses: ['BARCLASS'],
      api: {
        endpoint: '/result/clinical-indicator-aggregations',
        params: {
          groupBy: ['day', 'resultCategory1'],
          [MIN_DATE]: getTimePeriod(15, 'days', 'yyyy-MM-dd'),
          [MAX_DATE]: getTimePeriod(0, 'days', 'yyyy-MM-dd'),
        },
      },
      i18nKey: 'resultCategory1I18nKey',
      indexBy: 'day',
      keyToConsume: 'resultCategory1',
      filterBy: {
        resultCategory1: { values: ['Positive'] },
      },
      tickValuesYShape: 'clubsandwich',
      tickValuesXShape: 'all',
      displayMethod: 'actual',
      displayLegend: true,
      formatDate: 'dd MMM',
    },
  ],
}

const CovidDailyConfirmedGraph = ({ assays }) => {
  return (
    <ErrorBoundary key={covidDailyConfirmed.id}>
      <PermissionsProvider permissions={covidDailyConfirmed.graphRenderPermissions}>
        <GraphsContainer assaysFromState={assays} config={covidDailyConfirmed} />
      </PermissionsProvider>
    </ErrorBoundary>
  )
}

export default CovidDailyConfirmedGraph
