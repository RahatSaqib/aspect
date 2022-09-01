import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import { getTimePeriod } from '../../Helpers/Formatters'

import DATE_CONSTS from '../../../../utils/consts/DateTime/CONSTS'
import GRAPH_CONSTS from '../../../../utils/consts/Graphs/CONSTS'

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS
const assays = ['GxMtbRif', 'GxMtbRifUltra']

const tbGraphs = {
  tbDetected: {
    id: 'tbDetected',
    title: 'clinicalIndicatorsTBDetected',
    assays,
    componentSize: 'full',
    group: 'tb',
    graphRenderPermissions: ['dashboard'],
    graphType: [
      {
        id: 'tbResultsByCategory1Monthly',
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
        i18nKey: 'resultCategory1I18nKey',
        indexBy: 'month',
        keyToConsume: 'resultCategory1',
        filterBy: {},
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'percentage',
        displayLegend: true,
        formatDate: 'MMM',
        clickThrough: {
          allow: true,
          assays,
          baseUrl: '/browse/result?filters=',
          baseAssay: assays[0],
          keys: ['resultCategoryId', 'indexBy'],
        },
      },
      {
        id: 'tbResultsByCategory1Aggregate',
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
        indexBy: 'cnt',
        i18nKey: 'resultCategory1I18nKey',
        keyToConsume: 'resultCategory1',
        displayMethod: 'percentage',
        formatDate: 'MMM yy',
        averages: {
          showTotal: false,
          title: 'clinicalIndicatorsTBDetectedPie',
          key: ['Detected', 'Trace Detected'],
          subTitle: 'clinicalIndicatorsPieSubLegend',
        },
      },
    ],
  },
  tbResults: {
    id: 'tbResults',
    title: 'clinicalIndicatorsTBTitle',
    assays,
    componentSize: 'full',
    group: 'tb',
    graphRenderPermissions: ['dashboard'],
    graphType: [
      {
        id: 'tbByCategory1Monthly',
        component: BarGraph,
        type: 'bar',
        size: 8,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: '/result/clinical-indicator-aggregations',
          params: {
            groupBy: ['month', 'resultCategory2', 'resultCategory1'],
            [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
            flags: [GRAPH_CONSTS.GET_TOTAL_RESULTS],
          },
        },
        i18nKey: 'resultCategory2I18nKey',
        indexBy: 'month',
        keyToConsume: 'resultCategory2',
        filterBy: {
          resultCategory1: { values: ['Detected'] },
        },
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'percentage',
        displayLegend: true,
        formatDate: 'MMM',
        clickThrough: {
          allow: true,
          assays,
          baseUrl: '/browse/result?filters=',
          baseAssay: assays[0],
          keys: ['resultCategoryId', 'indexBy'],
        },
      },
      {
        id: 'tbByCategory1Aggregate',
        component: PieGraph,
        type: 'pie',
        size: 4,
        componentClasses: ['piegraph__container'],
        api: {
          endpoint: '/result/clinical-indicator-aggregations',
          params: {
            groupBy: ['resultCategory2', 'resultCategory1'],
            [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'cnt',
        i18nKey: 'resultCategory2I18nKey',
        keyToConsume: 'resultCategory2',
        displayMethod: 'percentage',
        formatDate: 'MMM yy',
        filterBy: {
          resultCategory1: { values: ['Detected'] },
        },
        averages: {
          showTotal: false,
          title: 'clinicalIndicatorsTBPieLegend',
          key: ['Detected'],
          subTitle: 'clinicalIndicatorsPieSubLegend',
        },
      },
    ],
  },
}

export default tbGraphs
