import BarGraph from '../../../../MigratedComponents/Graphs/BarGraph'
import PieGraph from '../../../../MigratedComponents/Graphs/PieGraph'

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
        size: 6,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: 'result/follow-up-aggregations',
          params: {
            groupBy: ['day'],
            followUp: 'died',
            followUpType: 'outcome',
            minDate: '2019-11-01',
            maxDate: '2020-04-30',
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
        size: 6,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: 'result/follow-up-aggregations',
          params: {
            groupBy: ['day'],
            followUp: 'recovered',
            followUpType: 'outcome',
            minDate: '2019-11-01',
            maxDate: '2020-04-30',
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
        size: 12,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: 'result/follow-up-aggregations',
          params: {
            groupBy: ['day', 'gender'],
            followUp: 'recovered',
            followUpType: 'outcome',
            minDate: '2019-11-01',
            maxDate: '2020-04-30',
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
}

export default covidGraphs
