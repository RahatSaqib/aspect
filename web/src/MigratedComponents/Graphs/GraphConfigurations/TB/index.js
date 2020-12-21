import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import { getTimePeriod } from '../../Helpers/Formatters'

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
            minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'month',
        keyToConsume: 'resultCategory1',
        filterBy: {},
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'percentage',
        displayLegend: true,
        formatDate: 'MMM yy',
        clickThrough: {
          allow: true,
          baseUrl: '/browse/result?filters=',
          baseAssay: assays[0],
          keys: ['resultCategoryId', 'indexBy', 'diseaseId'],
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
            minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'cnt',
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
            minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'month',
        keyToConsume: 'resultCategory2',
        filterBy: {
          resultCategory1: { values: ['Detected'] },
        },
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'percentage',
        displayLegend: true,
        formatDate: 'MMM yy',
        clickThrough: {
          allow: true,
          baseUrl: '/browse/result?filters=',
          baseAssay: assays[0],
          keys: ['resultCategoryId', 'indexBy', 'diseaseId'],
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
            minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'cnt',
        keyToConsume: 'resultCategory2',
        displayMethod: 'percentage',
        formatDate: 'MMM yy',
        filterBy: {
          resultCategory1: { values: ['Detected'] },
        },
        averages: {
          showTotal: false,
          title: 'clinicalIndicatorsTBPieLegend',
          key: ['Detected', 'Indeterminate'],
          subTitle: 'clinicalIndicatorsPieSubLegend',
        },
      },
    ],
  },
}

export default tbGraphs
