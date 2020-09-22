import BarGraph from '../../BarGraph'
import AspectDropdown from '../../../AspectDropdown'

const inventoryGraphs = {
  inventoryStatus: {
    id: 'inventoryStatus',
    title: 'clinicalIndicatorsTBDetected',
    assays: [],
    selectorModifiers: [
      {
        selectedValue: 'Consumable',
        endpoint: '/dashboard/inventory-item',
        state: 'data.inventoryConsumableSummaryList',
        component: AspectDropdown,
        identifier: 'consumableId',
        data: null,
        sortByKeys: ['consumableName'],
        initialOption: 2,
        keyMapping: { idKey: 'consumableId', nameKey: 'consumableName' },
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
          endpoint: '/inventory/days-by-location',
          params: {
            consumableId: 5,
          },
        },
        indexBy: 'increment',
        keyToConsume: 'count',
        filterBy: {},
        tickValuesYShape: 'twos',
        tickValuesXShape: 'all',
        displayMethod: 'actual',
        displayLegend: false,
        formatDate: 'MMM yy',
      },
    ],
  },
}

export default inventoryGraphs
