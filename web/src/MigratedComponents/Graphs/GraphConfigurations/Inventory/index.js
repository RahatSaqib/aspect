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
        legendsToRename: [
          {
            externalId: 'outOfStock',
            name: 'Out of Stock',
          },
          {
            externalId: 'upTo14',
            name: '1-14 Days ',
          },
          {
            externalId: 'upTo30',
            name: '15-30 Days',
          },
          {
            externalId: 'upTo90',
            name: '1-3 Months',
          },
          {
            externalId: 'upTo180',
            name: '4-6 Months',
          },
          {
            externalId: 'moreThan180',
            name: '>6 Months',
          },
          {
            externalId: 'notRecorded',
            name: 'Not Recorded',
          },
          {
            externalId: 'noConsumption',
            name: 'No Consumption',
          },
        ],
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
