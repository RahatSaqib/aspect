import BarGraph from '../../../../MigratedComponents/Graphs/BarGraph'
import PieGraph from '../../../../MigratedComponents/Graphs/PieGraph'

const tbGraphs = {
  tbResults: {
    id: 'tbResults',
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
            minDate: '2019-11-01',
            maxDate: '2020-04-30',
          },
        },
        indexBy: 'month',
        keyToConsume: 'resultCategory1',
        tickValuesY: 'none', // bookends, clubsandwich, all, none
        tickValuesX: 'all', // bookends, all, none
        displayMethod: 'percentage',
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
            minDate: '2019-11-01',
            maxDate: '2020-04-30',
          },
        },
        indexBy: 'cnt',
        keyToConsume: 'resultCategory1',
        averages: {
          showTotal: true,
          title: 'Fix me please',
          key: ['NotDetected', 'LessThan1000'],
          subTitle: 'Total Cases',
        },
      },
    ],
  },
}

export default tbGraphs
