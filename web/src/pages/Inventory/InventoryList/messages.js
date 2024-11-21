import { defineMessages } from 'react-intl'
import allMessages from '../../../messages/allMessages'

const messages = defineMessages({
  ...allMessages,
  reconciliationConfiguration: {
    id: 'pages.inventoryList.reconciliationConfiguration',
    defaultMessage: 'Reconciliation Configuration',
  },
  inventoryItemName: { id: 'pages.inventoryList.InventoryItemName', defaultMessage: 'Inventory Item Name' },
  trackByDate: { id: 'pages.inventoryList.trackByDate', defaultMessage: 'Track by expiry date' },
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
})

export default messages
