import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import { getTimePeriod } from '../../Helpers/Formatters'

import DATE_CONSTS from '../../../../utils/consts/DateTime/CONSTS'
import GRAPH_CONSTS from '../../../../utils/consts/Graphs/CONSTS'

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

const assays = [
  'abbottM2000DBSHivVL',
  'abbottM2000PlasmaHivVL',
  'assayAlereQHiv12Detect',
  'assayAlereQHiv12VLPlasma',
  'assayCobasHivVl',
  'GxHiv1Vl',
  'QHivVL',
  'ReporterHivVL',
]

const hivGraphs = {
  hivResults: {
    id: 'hivResults',
    title: 'clinicalIndicatorsVLTitle',
    componentSize: 'full',
    group: 'hiv',
    assays,
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
            groupBy: ['month', 'resultCategory1'],
            [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
            flags: [GRAPH_CONSTS.GET_TOTAL_RESULTS],
          },
        },
        indexBy: 'month',
        i18nKey: 'resultCategory1I18nKey',
        keyToConsume: 'resultCategory1',
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'percentage',
        displayLegend: true,
        formatDate: 'MMM',
        clickThrough: {
          allow: true,
          baseUrl: '/browse/result?filters=',
          baseAssay: assays[0],
          keys: ['resultCategoryId', 'indexBy', 'diseaseId'],
        },
      },
      {
        id: 'hivByCategory1Aggregate',
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
        keyToConsume: 'resultCategory1',
        displayMethod: 'percentage',
        i18nKey: 'resultCategory1I18nKey',
        formatDate: 'MMM yy',
        averages: {
          showTotal: false,
          title: 'clinicalIndicatorsPieLegend',
          key: ['LessThan40', 'LessThan1000', 'NotDetected'],
          subTitle: 'clinicalIndicatorsPieSubLegend',
        },
      },
    ],
  },
}

export default hivGraphs
