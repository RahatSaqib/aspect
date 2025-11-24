import { defineMessages } from 'react-intl'
import allMessages from '../../../messages/allMessages'

const messages = {
  ...allMessages,
  ...defineMessages({
    reconciliationConfiguration: {
      id: 'pages.inventoryList.reconciliationConfiguration',
      defaultMessage: 'Reconciliation Configuration',
    },
    inventoryItemName: { id: 'pages.inventoryList.InventoryItemName', defaultMessage: 'Inventory Item Name' },
    trackByBatch: { id: 'pages.inventoryList.New.trackByBatch', defaultMessage: 'Track by batch' },
    locationTracking: { id: 'pages.inventoryList.locationTracking', defaultMessage: 'Location Tracking' },
    totalOnHand: { id: 'pages.inventoryList.totalOnHand', defaultMessage: 'Total On Hand' },
    unit: { id: 'pages.inventoryList.unit', defaultMessage: 'Unit' },
    paginatorStatus: {
      id: 'pages.inventoryList.paginatorStatus',
      defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# Consumable}
      other {# Consumables}
    }`,
    },
  }),
}

export default messages
