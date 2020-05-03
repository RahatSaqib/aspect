import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import { getTimePeriod } from '../../Helpers/Formatters'

const covidGraphs = {
  covidMortalityAndRecoveryConfig: {
    id: 'covidMortalityAndRecoveryConfig',
    title: 'covidGraphDailyMortalityAndrecovery',
    assays: [
      'assayGenericCovid19',
      'assayGXCovid19',
      'assayMP96Covid19',
      'assayQS7Covid19',
    ],
    graphType: [
      {
        id: 'deathsPerDay',
        component: BarGraph,
        type: 'bar',
        size: 6,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: 'result/follow-up-aggregations',
          params: {
            groupBy: ['day'],
            followUp: 'died',
            followUpType: 'outcome',
            minDate: getTimePeriod(6, 'months', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'day',
        keyToConsume: 'followUp',
        displayMethod: 'actual',
        displayLegend: true,
        tickValuesY: 'clubsandwich',
        tickValuesX: 'bookends',
        formatDate: 'dd MMM',
      },
      {
        id: 'recoveriesPerDay',
        component: BarGraph,
        type: 'bar',
        size: 6,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: 'result/follow-up-aggregations',
          params: {
            groupBy: ['day'],
            followUp: 'recovered',
            followUpType: 'outcome',
            minDate: getTimePeriod(6, 'months', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'day',
        keyToConsume: 'followUp',
        displayMethod: 'actual',
        displayLegend: true,
        tickValuesY: 'bookends',
        tickValuesX: 'bookends',
        formatDate: 'dd MMM',
      },
    ],
  },
  covidCasesByAgeAndGender: {
    id: 'covidCasesByAgeAndGender',
    title: 'covidGraphDailyMortalityAndrecovery',
    assays: [
      'assayGenericCovid19',
      'assayGXCovid19',
      'assayMP96Covid19',
      'assayQS7Covid19',
    ],
    graphType: [
      {
        id: 'outcomeByGender',
        component: BarGraph,
        type: 'grouped',
        size: 12,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: 'result/follow-up-aggregations',
          params: {
            groupBy: ['day', 'gender'],
            followUp: 'recovered',
            followUpType: 'outcome',
            minDate: getTimePeriod(6, 'months', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'day',
        keyToConsume: 'gender',
        tickValuesY: 'all',
        tickValuesX: 'all',
        displayMethod: 'actual',
        displayLegend: true,
        formatDate: 'dd MMM',
      },
    ],
  },
  covidDailyConfirmed: {
    id: 'covidDailyConfirmed',
    title: 'clinicalIndicatorsCovidName',
    assays: [
      'assayGenericCovid19',
      'assayGXCovid19',
      'assayMP96Covid19',
      'assayQS7Covid19',
    ],
    graphType: [
      {
        id: 'dailyConfirmed',
        component: BarGraph,
        type: 'bar',
        size: 12,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: 'result/clinical-indicator-aggregations',
          params: {
            groupBy: ['day', 'resultCategory1'],
            minDate: getTimePeriod(15, 'days', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'days', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'day',
        keyToConsume: 'resultCategory1',
        filterBy: {
          resultCategory1: { values: ['Positive'] },
        },
        tickValuesY: 'clubsandwich',
        tickValuesX: 'all',
        displayMethod: 'actual',
        displayLegend: true,
        formatDate: 'dd MMM',
      },
    ],
  },
  covidMortalityAndrecoveryByGender: {
    id: 'covidMortalityAndrecoveryByGender',
    title: 'clinicalIndicatorsCovidName',
    assays: [
      'assayGenericCovid19',
      'assayGXCovid19',
      'assayMP96Covid19',
      'assayQS7Covid19',
    ],
    graphType: [
      {
        id: 'splitByFemale',
        component: PieGraph,
        type: 'pie',
        size: 6,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: 'result/follow-up-aggregations',
          params: {
            groupBy: ['day', 'gender'],
            followUpType: 'outcome',
            minDate: getTimePeriod(6, 'months', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
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
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: 'result/follow-up-aggregations',
          params: {
            groupBy: ['day', 'gender'],
            followUpType: 'outcome',
            minDate: getTimePeriod(6, 'months', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
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
  },
}

export default covidGraphs
