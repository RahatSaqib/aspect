import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import { getTimePeriod } from '../../Helpers/Formatters'

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
        id: 'hivByCategory1Monthly',
        component: BarGraph,
        type: 'bar',
        size: 8,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: '/result/clinical-indicator-aggregations',
          params: {
            groupBy: ['month', 'assay'],
            minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'month',
        keyToConsume: 'assay',
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'actual',
        displayLegend: true,
        formatDate: 'MMM yy',
      },
      // {
      //   id: 'hivByCategory1Aggregate',
      //   component: PieGraph,
      //   type: 'pie',
      //   size: 4,
      //   componentClasses: ['piegraph__container'],
      //   api: {
      //     endpoint: '/result/clinical-indicator-aggregations',
      //     params: {
      //       groupBy: ['resultCategory1'],
      //       minDate: getTimePeriod(6, 'months', 'yyyy-MM-dd'),
      //       maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
      //     },
      //   },
      //   indexBy: 'cnt',
      //   keyToConsume: 'resultCategory1',
      //   displayMethod: 'percentage',
      //   formatDate: 'MMM yy',
      //   averages: {
      //     showTotal: false,
      //     title: 'clinicalIndicatorsPieLegend',
      //     key: ['LessThan40', 'LessThan1000', 'NotDetected'],
      //     subTitle: 'clinicalIndicatorsPieSubLegend',
      //   },
      // },
    ],
  },
}

export default testsPerFormedGraphs
