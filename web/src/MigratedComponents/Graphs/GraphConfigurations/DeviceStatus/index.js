import BarGraph from '../../BarGraph'
import { getPreviousPeriod } from '../../Helpers/Formatters'

const minDate = getPreviousPeriod('months', 'yyyy-MM-dd').start
const maxDate = getPreviousPeriod('months', 'yyyy-MM-dd').end

const deviceStatusGraphs = {
  deviceStatus: {
    id: 'deviceStatus',
    title: 'deviceStatusTitle',
    assays: [],
    selectorModifiers: [],
    graphType: [
      {
        id: 'deviceStatusMonthly',
        component: BarGraph,
        type: 'stackedDeviceActivity',
        size: 12,
        componentClasses: ['BARCLASS'],
        api: {
          method: 'GET',
          endpoint: 'dashboard/operational-data/activity-over-time',
          params: {
            minDate,
            maxDate,
          },
        },
        indexBy: 'date',
        keyToConsume: 'devicesActive',
        tickValuesYShape: 'clubsandwich',
        tickValuesXShape: 'all',
        displayMethod: 'percentage',
        displayLegend: true,
        formatDate: 'LLLL do',
      },
    ],
  },
}

export default deviceStatusGraphs
