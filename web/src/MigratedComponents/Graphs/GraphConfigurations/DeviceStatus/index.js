import BarGraph from '../../BarGraph'
import { getTimePeriod } from '../../Helpers/Formatters'

const deviceStatusGraphs = {
  deviceStatus: {
    id: 'deviceStatus',
    title: 'deviceStatusGraphMonthly',
    assays: [],
    selectorModifiers: [],
    graphType: [
      {
        id: 'deviceStatusMonthly',
        component: BarGraph,
        type: 'barLegacyTreatment',
        size: 8,
        componentClasses: ['BARCLASS'],
        api: {
          method: 'POST',
          endpoint: 'result/confirmed-treatment-tracking',
          params: {},
        },
        indexBy: 'monthTested',
        keyToConsume: 'pcConfirmed',
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'percentage', // todo: actual
        displayLegend: true,
        formatDate: 'MMM yy',
      },
    ],
  },
}

export default deviceStatusGraphs
