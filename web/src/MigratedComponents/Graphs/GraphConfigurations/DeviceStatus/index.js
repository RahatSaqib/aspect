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
        type: 'stackedDeviceTreatment',
        size: 12,
        componentClasses: ['BARCLASS'],
        api: {
          method: 'GET',
          endpoint: 'dashboard/operational-data/activity-over-time',
          params: {
            minDate: '2020-06-01',
            maxDate: '2020-06-15',
          },
        },
        indexBy: 'date',
        keyToConsume: 'devicesActive',
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'actual', // todo: actual
        displayLegend: true,
        formatDate: 'MMM yy',
      },
    ],
  },
}

export default deviceStatusGraphs
