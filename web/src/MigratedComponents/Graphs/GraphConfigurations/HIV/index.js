import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import { getTimePeriod } from '../../Helpers/Formatters'

const hivGraphs = {
  hivResults: {
    id: 'hivResults',
    title: 'clinicalIndicatorsVLTitle',
    componentSize: 'full',
    group: 'hiv',
    assays: [
      'abbottM2000DBSHivVL',
      'abbottM2000PlasmaHivVL',
      'assayAlereQHiv12Detect',
      'assayAlereQHiv12VLPlasma',
      'assayCobasHivVl',
      'GxHiv1Vl',
      'QHivVL',
      'ReporterHivVL',
    ],
    graphType: [
      {
        id: 'hivByCategory1Monthly',
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
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'percentage',
        displayLegend: true,
        formatDate: 'MMM yy',
      },
      {
        id: 'hivByCategory1Aggregate',
        component: PieGraph,
        type: 'pie',
        size: 4,
        componentClasses: ['piegraph__container'],
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
          title: 'clinicalIndicatorsPieLegend',
          key: ['LessThan1000', 'NotDetected'],
          subTitle: 'clinicalIndicatorsPieSubLegend',
        },
      },
    ],
  },
}

export default hivGraphs
