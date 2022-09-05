import DATE_CONSTS from '../../../../utils/consts/DateTime/CONSTS'
import GRAPH_CONSTS from '../../../../utils/consts/Graphs/CONSTS'
import BarGraph from '../../BarGraph'
import CalendarGraph from '../../CalendarGraph'
import { getTimePeriod } from '../../Helpers/Formatters'
import PieGraph from '../../PieGraph'

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

const assays = ['assayGXCovid19', 'assayMP96Covid19', 'assayQS7Covid19', 'assayGenericCovid19']

const covidGraphs = {
  covidResults: {
    id: 'covidResults',
    title: 'clinicalIndicatorsCovidTitle',
    componentSize: 'full',
    group: 'covid',
    assays,
    graphRenderPermissions: ['dashboard'],
    graphType: [
      {
        id: 'covidByCategory1Monthly',
        component: BarGraph,
        type: 'bar',
        size: 8,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: '/result/clinical-indicator-aggregations',
          params: {
            groupBy: ['month', 'resultCategory1'],
            [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
            flags: [GRAPH_CONSTS.GET_TOTAL_RESULTS],
          },
        },
        indexBy: 'month',
        i18nKey: 'resultCategory1I18nKey',
        keyToConsume: 'resultCategory1',
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'percentage',
        displayLegend: true,
        formatDate: 'MMM',
        clickThrough: {
          allow: true,
          baseUrl: '/browse/result?filters=',
          baseAssay: assays[0],
          keys: ['resultCategoryId', 'indexBy', 'diseaseId'],
        },
      },
      {
        id: 'covidByCategory1Aggregate',
        component: PieGraph,
        type: 'pie',
        size: 4,
        componentClasses: ['piegraph__container'],
        api: {
          endpoint: '/result/clinical-indicator-aggregations',
          params: {
            groupBy: ['resultCategory1'],
            [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
          },
        },
        i18nKey: 'resultCategory1I18nKey',
        indexBy: 'cnt',
        keyToConsume: 'resultCategory1',
        displayMethod: 'percentage',
        formatDate: 'MMM yy',
        averages: {
          showTotal: false,
          title: 'clinicalIndicatorsCovidPieLegend',
          key: ['Positive', 'PresumptivePositive'],
          subTitle: 'clinicalIndicatorsPieSubLegend',
        },
      },
    ],
  },
  covidMortalityAndRecoveryConfig: {
    id: 'covidMortalityAndRecoveryConfig',
    title: 'covidGraphDailyMortalityAndrecovery',
    componentSize: 'full',
    group: 'covid',
    assays,
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
  },
  covidCasesByAgeAndGender: {
    id: 'covidCasesByAgeAndGender',
    title: 'covidGraphDailyMortalityAndRecoveryByGenderAndGender',
    assays,
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
  },
  covidDailyConfirmed: {
    id: 'covidDailyConfirmed',
    title: 'clinicalIndicatorsCovidName',
    assays,
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
  },
  covidMortalityAndRecoveryByGender: {
    id: 'covidMortalityAndRecoveryByGender',
    title: 'clinicalIndicatorsCovidGenderRecoveryRates',
    assays,
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
  },
  covidGenderByCalendar: {
    id: 'covidGenderByCalendar',
    title: 'clinicalIndicatorsCovidName',
    assays,
    graphRenderPermissions: ['covid'],
    graphType: [
      {
        id: 'dailyConfirmedFemale',
        component: CalendarGraph,
        type: 'calendar',
        size: 12,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: '/result/follow-up-aggregations',
          params: {
            groupBy: ['day', 'gender'],
            followUpType: 'outcome',
            [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
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
        displayLegend: true,
        formatDate: 'dd MMM',
      },
    ],
  },
}

export default covidGraphs
