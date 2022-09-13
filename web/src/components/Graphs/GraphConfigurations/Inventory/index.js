import ConsumableDropDown from '../../../AspectDropDown/ConsumableDropDown'
import BarGraph from '../../BarGraph'

const inventoryGraphs = {
  inventoryStatus: {
    id: 'inventoryStatus',
    title: 'inventoryGraphStatus',
    assays: [],
    selectorModifiers: [
      {
        component: ConsumableDropDown,
      },
    ],
    componentSize: 'full',
    group: 'assaysNotNeeded',
    graphRenderPermissions: ['dashboard', 'operationalData'],
    graphType: [
      {
        id: 'suppliesExpiryByPeriod',
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
        },
        sortByKeys: ['consumableName'],
        indexBy: 'increment',
        keyToConsume: 'count',
        filterBy: {},
        tickValuesYShape: 'twos',
        tickValuesXShape: 'all',
        displayMethod: 'actual',
        displayLegend: false,
        formatDate: 'MMM yy',
        clickThrough: {
          allow: true,
          baseUrl: '/browse/inventory?filters=',
          keys: [
            'daysStockLeft',
            'consumableId',
            id => {
              if (id === 'noConsumption') {
                return {
                  hasStock: true,
                }
              }
            },
          ],
        },
      },
    ],
  },
}

export default inventoryGraphs
