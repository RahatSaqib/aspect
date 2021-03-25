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
        identifier: 'consumableExternalId',
        data: null,
        sortByKeys: ['consumableName'],
        keyMapping: {
          idKey: 'consumableExternalId',
          nameKey: 'consumableName',
        },
        isClearable: false,
        defaultSelectedOption: {
          key: 'consumableExternalId',
          value: 'GxMtbRifCartridge',
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
            consumableExternalId: 'GxMtbRifCartridge',
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
