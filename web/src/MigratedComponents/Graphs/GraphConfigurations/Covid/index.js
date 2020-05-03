import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import { getTimePeriod } from '../../Helpers/Formatters'

const covidGraphs = {
  covidMortalityAndRecoveryConfig: {
    id: 'covidMortalityAndRecoveryConfig',
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
        tickValuesY: 'clubsandwich', // bookends, clubsandwich, all, none
        tickValuesX: 'bookends', // bookends, all, none
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
        tickValuesY: 'bookends', // bookends, clubsandwich, all, none
        tickValuesX: 'bookends', // bookends, all, none
        formatDate: 'dd MMM',
      },
    ],
  },
  covidRecoveryByGender: {
    id: 'covidRecoveryByGender',
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
        type: 'bar',
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
        tickValuesY: 'none', // bookends, clubsandwich, all, none
        tickValuesX: 'all', // bookends, all, none
        displayMethod: 'percentage',
        formatDate: 'dd MMM',
      },
    ],
  },
  covidDailyConfirmed: {
    id: 'covidDailyConfirmed',
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
        tickValuesY: 'clubsandwich', // bookends, clubsandwich, all, none
        tickValuesX: 'all', // bookends, all, none
        displayMethod: 'actual',
        formatDate: 'dd MMM',
      },
    ],
  },
}

export default covidGraphs
