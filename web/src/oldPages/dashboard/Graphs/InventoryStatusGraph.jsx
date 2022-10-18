import React from 'react'
import ConsumableDropDown from '../../../components/AspectDropDown/ConsumableDropDown'
import ErrorBoundary from '../../../components/ErrorBoundary'
import BarGraph from '../../../components/Graphs/BarGraph'
import GraphsContainer from '../../../components/Graphs/GraphsContainer'
import PermissionsProvider from '../../../providers/PermissionsProvider'

const inventoryStatus = {
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
}

const InventoryStatusGraph = ({ assays }) => {
  return (
    <ErrorBoundary key={inventoryStatus.id}>
      <PermissionsProvider permissions={inventoryStatus.graphRenderPermissions}>
        <GraphsContainer assaysFromState={assays} config={inventoryStatus} />
      </PermissionsProvider>
    </ErrorBoundary>
  )
}

export default InventoryStatusGraph
