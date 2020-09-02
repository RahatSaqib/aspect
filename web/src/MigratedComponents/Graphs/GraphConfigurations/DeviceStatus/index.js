import BarGraph from '../../BarGraph'
import { getPreviousPeriod, dateRangeOptions } from '../../Helpers/Formatters'
import AspectDropdown from '../../../AspectDropdown'

const minDate = getPreviousPeriod('months', 'yyyy-MM-dd').start
const maxDate = getPreviousPeriod('months', 'yyyy-MM-dd').end

const deviceStatusGraphs = {
  deviceStatus: {
    id: 'deviceStatus',
    title: 'deviceStatusTitle',
    componentSize: 'full',
    group: 'assaysNotNeeded',
    assays: [],
    selectorModifiers: [
      {
        selectedValue: 'Date Range',
        endpoint: false,
        state: 'deviceDateRange',
        component: AspectDropdown,
        identifier: 'dateRange',
        data: dateRangeOptions('deviceDateRange'),
        sortByKeys: ['id'],
      },
    ],
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
        displayLegend: false,
        formatDate: 'LLLL do',
      },
    ],
  },
}

export default deviceStatusGraphs
