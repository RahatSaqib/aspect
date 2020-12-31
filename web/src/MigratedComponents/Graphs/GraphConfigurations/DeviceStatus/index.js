import BarGraph from '../../BarGraph'
import { getPreviousPeriod, dateRangeOptions } from '../../Helpers/Formatters'
import AspectDropdown from '../../../AspectDropdown'

import DATE_CONSTS from '../../../../globals/consts/DateTime/CONSTS'

const {
  DATE_RANGE_OPTIONS,
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

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
        isClearable: false,
        defaultSelectedOption: DATE_RANGE_OPTIONS.LAST_MONTH,
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
            [MIN_DATE]: getPreviousPeriod('months', 'yyyy-MM-dd').start,
            [MAX_DATE]: getPreviousPeriod('months', 'yyyy-MM-dd').end,
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
