import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import CalendarGraph from '../../CalendarGraph'
import { getTimePeriod } from '../../Helpers/Formatters'

const covidGraphs = {
  covidMortalityAndRecoveryConfig: {
    id: 'covidMortalityAndRecoveryConfig',
    title: 'covidGraphDailyMortalityAndrecovery',
    componentSize: 'full',
    group: 'covid',
    assays: [
      'assayGenericCovid19',
      'assayGXCovid19',
      'assayMP96Covid19',
      'assayQS7Covid19',
    ],
    graphRenderPermissions: ['covid'],
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
        displayLegend: false, // uses custom legend that can wrap
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
        displayLegend: false, // uses custom legend that can wrap
        tickValuesYShape: 'bookends',
        tickValuesXShape: 'bookends',
        formatDate: 'dd MMM',
      },
    ],
  },
  covidCasesByAgeAndGender: {
    id: 'covidCasesByAgeAndGender',
    title: 'covidGraphDailyMortalityAndRecoveryByGenderAndGender',
    assays: [
      'assayGenericCovid19',
      'assayGXCovid19',
      'assayMP96Covid19',
      'assayQS7Covid19',
    ],
    graphRenderPermissions: ['covid'],
    graphType: [
      {
        id: 'outcomeByGender',
        component: BarGraph,
        type: 'divergent',
        size: 12,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: 'result/follow-up-aggregations',
          params: {
            groupBy: ['day', 'gender', 'age'],
            followUpType: 'outcome',
            minDate: getTimePeriod(6, 'months', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
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
        displayLegend: false, // uses custom legend that can wrap
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
    graphRenderPermissions: ['covid'],
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
        tickValuesYShape: 'clubsandwich',
        tickValuesXShape: 'all',
        displayMethod: 'actual',
        displayLegend: false, // uses custom legend that can wrap
        formatDate: 'dd MMM',
      },
    ],
  },
  covidMortalityAndRecoveryByGender: {
    id: 'covidMortalityAndRecoveryByGender',
    title: 'clinicalIndicatorsCovidGenderRecoveryRates',
    assays: [
      'assayGenericCovid19',
      'assayGXCovid19',
      'assayMP96Covid19',
      'assayQS7Covid19',
    ],
    graphRenderPermissions: ['covid'],
    graphType: [
      {
        id: 'splitByFemale',
        component: PieGraph,
        type: 'pie',
        size: 6,
        componentClasses: ['piegraph__container'],
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
        componentClasses: ['piegraph__container'],
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
  covidGenderByCalendar: {
    id: 'covidGenderByCalendar',
    title: 'clinicalIndicatorsCovidName',
    assays: [
      'assayGenericCovid19',
      'assayGXCovid19',
      'assayMP96Covid19',
      'assayQS7Covid19',
    ],
    graphRenderPermissions: ['covid'],
    graphType: [
      {
        id: 'dailyConfirmedFemale',
        component: CalendarGraph,
        type: 'calendar',
        size: 12,
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
        indexBy: 'day',
        keyToConsume: 'followUp',
        filterBy: {
          gender: { values: ['Female'] },
          followUp: { values: ['died', 'recovered'] },
        },
        tickValuesYShape: 'clubsandwich',
        tickValuesXShape: 'all',
        displayMethod: 'actual',
        displayLegend: false, // uses custom legend that can wrap
        formatDate: 'dd MMM',
      },
    ],
  },
}

export default covidGraphs
