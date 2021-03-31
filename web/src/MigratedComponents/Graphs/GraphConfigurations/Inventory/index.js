import BarGraph from '../../BarGraph'
import ConsumableDropdown from '../../../AspectDropDown/ConsumableDropdown'

const inventoryGraphs = {
  inventoryStatus: {
    id: 'inventoryStatus',
    title: 'inventoryGraphStatus',
    assays: [],
    selectorModifiers: [
      {
        component: ConsumableDropdown,
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
