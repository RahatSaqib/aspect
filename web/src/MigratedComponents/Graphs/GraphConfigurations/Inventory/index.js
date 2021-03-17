import BarGraph from '../../BarGraph'
import AspectDropDown from '../../../AspectDropDown'

const inventoryGraphs = {
  inventoryStatus: {
    id: 'inventoryStatus',
    title: 'inventoryGraphStatus',
    assays: [],
    selectorModifiers: [
      {
        selectedValue: 'Consumable',
        endpoint: '/dashboard/inventory-item',
        state: 'data.inventoryConsumableSummaryList',
        component: AspectDropDown,
        identifier: 'consumableId',
        data: null,
        sortByKeys: ['consumableName'],
        keyMapping: { idKey: 'consumableId', nameKey: 'consumableName' },
        isClearable: false,
        defaultSelectedOption: {
          key: 'consumableName',
          value: 'GeneXpert TB Cartridge',
        },
      },
    ],
    componentSize: 'full',
    group: 'assaysNotNeeded',
    graphRenderPermissions: ['dashboard', 'operationalData'],
    graphType: [
      {
        id: 'tbResultsByCategory1Monthly',
        component: BarGraph,
        type: 'barInventory',
        size: 12,
        i18nKey: {
          moreThan180: 'moreThan180',
          noConsumption: 'noConsumption',
          notRecorded: 'notRecorded',
          outOfStock: 'outOfStock',
          upTo14: 'upTo14',
          upTo30: 'upTo30',
          upTo90: 'upTo90',
          upTo180: 'upTo180',
        },
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: '/inventory/days-by-location',
          params: {
            consumableId: 3,
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
