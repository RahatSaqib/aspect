import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import { getTimePeriod } from '../../Helpers/Formatters'

import DATE_CONSTS from '../../../../globals/consts/DateTime/CONSTS'

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

const testsPerFormedGraphs = {
  testsOverTime: {
    id: 'testsOverTime',
    title: 'testsOverTimeTitle',
    componentSize: 'full',
    group: 'assaysNotNeeded',
    assays: [],
    selectorModifiers: [],
    graphRenderPermissions: ['dashboard'],
    graphType: [
      {
        id: 'testPerformedMonthlyPercentage',
        component: BarGraph,
        type: 'bar',
        size: 8,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: '/result/clinical-indicator-aggregations',
          params: {
            groupBy: ['month', 'assay'],
            [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            [MAX_DATE]: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'month',
        keyToConsume: 'assay',
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'actual',
        displayLegend: true,
        formatDate: 'MMM yy',
        clickThrough: {
          allow: true,
          baseUrl: '/browse/result?filters=',
          keys: ['assay', 'indexBy'],
        },
      },
      {
        id: 'testPerformedMonthlytotal',
        component: PieGraph,
        type: 'pie',
        size: 4,
        componentClasses: ['piegraph__container'],
        api: {
          endpoint: '/result/clinical-indicator-aggregations',
          params: {
            groupBy: ['month', 'assay'],
            [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            [MAX_DATE]: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'cnt',
        keyToConsume: 'assay',
        displayMethod: 'percentage',
        formatDate: 'MMM yy',
        averages: {
          showTotal: false,
          totalDisplayMethod: 'actual',
          title: 'testsOverTimeAvgTitle',
          key: '*',
          subTitle: null,
        },
      },
    ],
  },
}

export default testsPerFormedGraphs
