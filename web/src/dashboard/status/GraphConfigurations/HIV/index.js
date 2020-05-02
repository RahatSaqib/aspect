import BarGraph from '../../../../MigratedComponents/Graphs/BarGraph'
import PieGraph from '../../../../MigratedComponents/Graphs/PieGraph'
import { getTimePeriod } from '../../../../MigratedComponents/Graphs/Helpers/Formatters'

const hivGraphs = {
  hivResults: {
    id: 'hivResults',
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
        tickValuesY: 'clubsandwich', // bookends, clubsandwich, all, none
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
            minDate: getTimePeriod(6, 'months', 'yyyy-MM-dd'),
            maxDate: getTimePeriod(0, 'months', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'cnt',
        keyToConsume: 'resultCategory1',
        averages: {
          showTotal: false,
          title: 'to fix: i18n Strings',
          key: ['NotDetected', 'LessThan1000'],
          subTitle: 'Total Cases',
        },
      },
    ],
  },
}

export default hivGraphs
