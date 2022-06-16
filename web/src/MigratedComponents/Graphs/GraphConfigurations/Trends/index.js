import reduce from 'lodash/reduce'

import LineGraph from '../../LineGraph'
import BarGraph from '../../BarGraph'
import { getTimePeriod } from '../../Helpers/Formatters'
import FilterByStateDropDown from '../../../AspectDropDown/FilterByStateDropDown'
import DATE_CONSTS from '../../../../globals/consts/DateTime/CONSTS'
import { MtbToTotalPercentage, RrdToMtbPercentage } from './Layers'

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
      const fieldName = 'month'
      const xAxisLabels = MONTHS
      const [yyyy, mm] = item[fieldName].split('-')
      let it = acc.find(({ id }) => id === yyyy)
      if (!it) {
        it = {
          id: yyyy,
          data: xAxisLabels.map(name => ({
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
    group: 'tb-trends',
    selectorModifiers: [
      {
        component: FilterByStateDropDown,
        identifier: 'stateId', // for query param name
        isClearable: true,
        isClientSide: true,
        filterFunctions: [
          {
            id: graphType.id,
            shouldFilterOnServer: true,
          },
        ],
      },
    ],
    graphRenderPermissions: ['dashboard'],
    graphType: [
      {
        component: LineGraph,
        type: 'line-trends',
        size: 12,
        componentClasses: [],
        api: {
          endpoint: '/result/clinical-indicator-aggregations',
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

/**
 * in years
 */
const trendInYearsAllTests = getGraphEntry({
  id: 'trendInYearsAllTests',
  title: 'testingTrendsInYearTitle',
  graphType: {
    id: 'tbAllTestsYearlyTrends',
    i18nKey: 'resultCategory1I18nKey',
    indexBy: 'month',
    keyToConsume: '',
  },
  api: {
    params: {
      groupBy: ['month'],
      [MIN_DATE]: '2019-01-01',
      [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
    },
    formatData: data => getData(data),
  },
})
const trendInYearsMtbDetected = getGraphEntry({
  id: 'trendInYearsMtbDetected',
  title: 'mtbDetectedTrendsInYearTitle',
  graphType: {
    id: 'tbMtbDetectedYearlyTrends',
    i18nKey: 'resultCategory2I18nKey',
    indexBy: 'month',
    keyToConsume: '',
  },
  api: {
    params: {
      groupBy: ['month'],
      [MIN_DATE]: '2019-01-01',
      [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
      resultCategory1: 'Detected',
    },
    formatData: data => getData(data),
  },
})
const trendInYearsRifDetected = getGraphEntry({
  id: 'trendInYearsRifDetected',
  title: 'rifDetectedTrendsInYearTitle',
  graphType: {
    id: 'tbRifDetectedYearlyTrends',
    i18nKey: 'resultCategory2I18nKey',
    indexBy: 'month',
    keyToConsume: '',
  },
  api: {
    params: {
      groupBy: ['month'],
      [MIN_DATE]: '2019-01-01',
      [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
      resultCategory1: 'Detected',
      resultCategory2: 'Detected',
    },
    formatData: data => getData(data),
  },
})

/**
 * in quarters
 */
const trendInQuartersMtbDetected = getGraphEntry({
  id: 'trendInQuartersMtbDetected',
  title: 'mtbDetectedTrendsInQuarterTitle',
  graphType: {
    component: BarGraph,
    id: 'tbMtbDetectedQuarterlyTrends',
    type: 'bar-line',
    indexBy: 'quarter', // is used for setting jsx `key` in loops
    keyToConsume: '',
    filterBy: {},
    groupMode: 'grouped',
    tickValuesYShape: 'twos',
    formatDate: value => {
      const [yyyy, qq] = `${value}`.split('-')
      return `Q${qq}-${yyyy.substring(2)}`
    },
    layers: [MtbToTotalPercentage],
    getColorIdByFieldName: fieldName => {
      if (fieldName === 'Total') return 'caseTotal'
      if (fieldName === 'MtbDetected') return 'caseDetected'
      if (fieldName === 'MtbToTotalPercentage')
        return 'casePercentDetectedOfTotal'
      return 'unknown'
    },
  },
  api: {
    params: {
      groupBy: ['resultCategory1'],
      [MIN_DATE]: '2019-01-01',
      [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
    },
    endpoint: '/result/trend-in-quarters-mtb-detected',
    isServerSide: true,
  },
})
const trendInQuartersRifDetected = getGraphEntry({
  id: 'trendInQuartersRifDetected',
  title: 'rifDetectedTrendsInQuarterTitle',
  graphType: {
    component: BarGraph,
    id: 'tbRifDetectedQuarterlyTrends',
    type: 'bar-line',
    indexBy: 'quarter',
    keyToConsume: '',
    filterBy: {},
    groupMode: 'grouped',
    tickValuesYShape: 'twos',
    formatDate: value => {
      const [yyyy, qq] = `${value}`.split('-')
      return `Q${qq}-${yyyy.substring(2)}`
    },
    layers: [RrdToMtbPercentage],
    getColorIdByFieldName: fieldName => {
      if (fieldName === 'MtbDetected') return 'caseTotal'
      if (fieldName === 'RrdDetected') return 'caseDetected'
      if (fieldName === 'RrdToMtbPercentage')
        return 'casePercentDetectedOfTotal'
      return 'unknown'
    },
  },
  api: {
    params: {
      groupBy: ['resultCategory1', 'resultCategory2'],
      [MIN_DATE]: '2019-01-01',
      [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
    },
    endpoint: '/result/trend-in-quarters-rif-detected',
    isServerSide: true,
  },
})

export default {
  trendInYears: {
    trendInYearsAllTests,
    trendInYearsMtbDetected,
    trendInYearsRifDetected,
  },
  trendInQuarters: {
    trendInQuartersMtbDetected,
    trendInQuartersRifDetected,
  },
}
