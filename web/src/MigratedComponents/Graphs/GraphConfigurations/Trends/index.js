import reduce from 'lodash/reduce'
import LineGraph from '../../LineGraph'
import { getTimePeriod } from '../../Helpers/Formatters'

import DATE_CONSTS from '../../../../globals/consts/DateTime/CONSTS'

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS
const assays = ['GxMtbRif', 'GxMtbRifUltra']
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const getData = data =>
  reduce(
    data,
    (acc, item) => {
      const [yyyy, mm] = item.month.split('-')
      let it = acc.find(({ id }) => id === yyyy)
      if (!it) {
        it = {
          id: yyyy,
          data: MONTHS.map(name => ({
            x: name,
            y: null,
          })),
        }
        acc = [...acc, it]
      }
      it.data[+mm - 1].y = item.cnt

      return acc
    },
    []
  ).reverse()

const getGraphEntry = ({ id, title, graphType, api }) => {
  return {
    id,
    title,
    assays,
    componentSize: 'full',
    group: 'tb-yearly-trends',
    graphRenderPermissions: ['dashboard'],
    graphType: [
      {
        component: LineGraph,
        type: 'line-trends',
        size: 12,
        componentClasses: [],
        api: {
          endpoint: '/result/clinical-indicator-aggregations',
          prepareData: data => getData(data),
          ...api,
        },
        filterBy: {},
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'actual',
        displayLegend: true,
        formatDate: 'MMM',
        clickThrough: false,
        ...graphType,
      },
    ],
  }
}

const tbGraphs = {
  trendInYearsAllTests: getGraphEntry({
    id: 'trendInYearsAllTests',
    title: 'testingTrendsInYearTitle',
    graphType: {
      id: 'tbAllTestsYearlyTrends',
      i18nKey: 'resultCategory1I18nKey',
      indexBy: 'month',
      keyToConsume: 'resultCategory1',
    },
    api: {
      params: {
        groupBy: ['month'],
        [MIN_DATE]: '2019-01-01',
        [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
      },
    },
  }),
  trendInYearsMtbDetected: getGraphEntry({
    id: 'trendInYearsMtbDetected',
    title: 'mtbDetectedTrendsInYearTitle',
    graphType: {
      id: 'tbMtbDetectedYearlyTrends',
      i18nKey: 'resultCategory2I18nKey',
      indexBy: 'month',
      keyToConsume: 'resultCategory1',
      filterBy: {
        resultCategory1: { values: ['Detected'] },
      },
    },
    api: {
      params: {
        groupBy: ['month', 'resultCategory1'],
        [MIN_DATE]: '2019-01-01',
        [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
      },
    },
  }),
  trendInYearsRifDetected: getGraphEntry({
    id: 'trendInYearsRifDetected',
    title: 'rifDetectedTrendsInYearTitle',
    graphType: {
      id: 'tbRifDetectedYearlyTrends',
      i18nKey: 'resultCategory2I18nKey',
      indexBy: 'month',
      keyToConsume: 'resultCategory2',
      filterBy: {
        resultCategory1: { values: ['Detected'] },
        resultCategory2: { values: ['Detected'] },
      },
    },
    api: {
      params: {
        groupBy: ['month', 'resultCategory1', 'resultCategory2'],
        [MIN_DATE]: '2019-01-01',
        [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
      },
    },
  }),
}

export default tbGraphs
