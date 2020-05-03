import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import { getTimePeriod } from '../../Helpers/Formatters'

const tbGraphs = {
  tbResults: {
    id: 'tbResults',
    title: 'clinicalIndicatorsTBTitle',
    assays: ['GxMtbRif', 'GxMtbRifUltra'],
    graphType: [
      {
        id: 'resultsByCategory1Monthly',
        component: BarGraph,
        type: 'bar',
        size: 8,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: 'result/clinical-indicator-aggregations',
          params: {
            groupBy: ['month', 'resultCategory1'],
            minDate: getTimePeriod(6, 'months', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'month',
        keyToConsume: 'resultCategory1',
        tickValuesY: 'none',
        tickValuesX: 'all',
        displayMethod: 'percentage',
        displayLegend: true,
        formatDate: 'MMM yy',
      },
      {
        id: 'resultsByCategory1Aggregate',
        component: PieGraph,
        type: 'pie',
        size: 4,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: 'result/clinical-indicator-aggregations',
          params: {
            groupBy: ['resultCategory1'],
            minDate: getTimePeriod(6, 'months', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'cnt',
        keyToConsume: 'resultCategory1',
        displayMethod: 'percentage',
        formatDate: 'MMM yy',
        averages: {
          showTotal: false,
          title: 'clinicalIndicatorsTBPieLegend',
          key: ['NotDetected'],
          subTitle: 'clinicalIndicatorsPieSubLegend',
        },
      },
    ],
  },
}

export default tbGraphs
