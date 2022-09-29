import React from 'react'
import ErrorBoundary from '../../../components/ErrorBoundary'
import GraphsContainer from '../../../components/Graphs/GraphsContainer'
import { getTimePeriod } from '../../../components/Graphs/Helpers/Formatters'
import PieGraph from '../../../components/Graphs/PieGraph'
import DATE_CONSTS from '../../../utils/consts/DateTime/CONSTS'

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

const covidMortalityAndRecoveryByGender = {
  id: 'covidMortalityAndRecoveryByGender',
  title: 'clinicalIndicatorsCovidGenderRecoveryRates',
  assays: ['assayGXCovid19', 'assayMP96Covid19', 'assayQS7Covid19', 'assayGenericCovid19'],
  graphRenderPermissions: ['covid'],
  graphType: [
    {
      id: 'splitByFemale',
      component: PieGraph,
      type: 'pie',
      size: 6,
      componentClasses: ['piegraph__container'],
      api: {
        endpoint: '/result/follow-up-aggregations',
        params: {
          groupBy: ['day', 'gender'],
          followUpType: 'outcome',
          [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
          [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
        },
      },
      indexBy: 'cnt',
      keyToConsume: 'followUp',
      filterBy: {
        followUp: { values: ['died', 'recovered'] },
        gender: { values: ['Female'] },
      },
      displayMethod: 'percentage',
      formatDate: 'MMM yy',
      averages: {
        showTotal: true,
        title: 'covidGraphDailyMortalityAndRecoveryByGenderTests',
        key: ['recovered'],
        subTitle: 'covidGraphDailyMortalityAndRecoveryByGenderFemale',
      },
    },
    {
      id: 'splitByMale',
      component: PieGraph,
      type: 'pie',
      size: 6,
      componentClasses: ['piegraph__container'],
      api: {
        endpoint: '/result/follow-up-aggregations',
        params: {
          groupBy: ['day', 'gender'],
          followUpType: 'outcome',
          [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
          [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
        },
      },
      indexBy: 'cnt',
      keyToConsume: 'followUp',
      filterBy: {
        followUp: { values: ['died', 'recovered'] },
        gender: { values: ['Male'] },
      },
      displayMethod: 'percentage',
      formatDate: 'MMM yy',
      averages: {
        showTotal: true,
        title: 'covidGraphDailyMortalityAndRecoveryByGenderTests',
        key: ['recovered'],
        subTitle: 'covidGraphDailyMortalityAndRecoveryByGenderMale',
      },
    },
  ],
}

const CovidMortalityAndRecoveryByGenderGraph = ({ assays }) => {
  return (
    <ErrorBoundary key={covidMortalityAndRecoveryByGender.id}>
      <GraphsContainer assaysFromState={assays} config={covidMortalityAndRecoveryByGender} />
    </ErrorBoundary>
  )
}

export default CovidMortalityAndRecoveryByGenderGraph
