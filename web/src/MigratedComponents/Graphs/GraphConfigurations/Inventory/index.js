import BarGraph from '../../BarGraph'
import AspectDropdown from '../../../AspectDropdown'
import { getTimePeriod } from '../../Helpers/Formatters'

const inventoryGraphs = {
  inventoryStatus: {
    id: 'inventoryStatus',
    title: 'clinicalIndicatorsTBDetected',
    assays: [],
    selectorModifiers: [
      {
        selectedValue: 'Date Range',
        endpoint: '/dashboard/inventory-item',
        state: 'inventoryConsumableSummaryList',
        component: AspectDropdown,
        identifier: 'dateRange',
        data: null,
        sortByKeys: ['consumableName'],
      },
    ],
    componentSize: 'full',
    group: 'assaysNotNeeded',
    graphRenderPermissions: ['dashboard'],
    graphType: [
      {
        id: 'tbResultsByCategory1Monthly',
        component: BarGraph,
        type: 'barInventory',
        size: 12,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: 'inventory/days-by-location',
          params: {},
        },
        indexBy: 'increment',
        keyToConsume: 'count',
        filterBy: {
          consumableId: '5',
        },
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'actual',
        displayLegend: false,
        formatDate: 'MMM yy',
      },
    ],
  },
}

export default inventoryGraphs
