import BarGraph from '../../BarGraph'
import { getPreviousPeriod, dateRangeOptions } from '../../Helpers/Formatters'
import AspectDropDown from '../../../AspectDropDown'

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
        component: AspectDropDown,
        identifier: 'dateRange',
        data: dateRangeOptions('deviceDateRange'),
        sortByKeys: ['id'],
        isClearable: false,
        defaultSelectedOption: 2,
      },
    ],
    graphRenderPermissions: ['dashboard', 'operationalData'],
    graphType: [
      {
        id: 'deviceStatusMonthly',
        component: BarGraph,
        type: 'stackedDeviceActivity',
        size: 12,
        componentClasses: ['BARCLASS'],
        api: {
          method: 'GET',
          endpoint: '/dashboard/operational-data/activity-over-time',
          params: {
            minDate,
            maxDate,
          },
        },
        indexBy: 'date',
        keyToConsume: 'devicesActive',
        legendsToRename: [
          {
            externalId: 'devicesActive',
            name: 'Active',
          },
          {
            externalId: 'inactiveUnknown',
            name: 'Unknown ',
          },
        ],
        legendsToPopover: [
          {
            externalId: 'inactiveUnknown',
            tooltip: {
              show: true,
              placement: 'top',
              message: 'statusUnknownLegend',
            },
          },
        ],
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
